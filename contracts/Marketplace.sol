// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DbiliaToken.sol";
import "./PriceConsumerV3.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
//import "hardhat/console.sol";

contract Marketplace is PriceConsumerV3 {
    using SafeMath for uint256;

    DbiliaToken public dbiliaToken;

    mapping (uint256 => uint256) public tokenPriceUSD;

    // Events
    event SetForSale(
        uint256 _tokenId,
        uint256 _priceUSD,
        address indexed _seller,
        uint256 _timestamp
    );
    event PurchaseWithUSD(
        uint256 _tokenId,
        address indexed _buyer,
        string _buyerId,
        bool _isW3user,
        address _w3owner,
        string _w2owner,
        uint256 _timestamp
    );
    event PurchaseWithETH(
        uint256 _tokenId,
        address indexed _buyer,
        bool _isW3user,
        address _w3owner,
        string _w2owner,
        uint256 _fee,
        uint256 _creatorReceives,
        uint256 _sellerReceives,
        uint256 _timestamp
    );

    modifier isActive {
        require(!dbiliaToken.isMaintaining());
        _;
    }

    modifier onlyDbilia() {
        require(
            msg.sender == dbiliaToken.owner() ||
            msg.sender == dbiliaToken.dbiliaTrust(),
            "caller is not one of dbilia accounts"
        );
        _;
    }

    constructor(address _tokenAddress) {
        dbiliaToken = DbiliaToken(_tokenAddress);
    }

    /**
        SET FOR SALE FUNCTIONS
        - When w2 or w3user wants to put it up for sale
        - trigger getTokenOwnership() by passing in tokenId and find if it belongs to w2 or w3user
        - if w2 or w3user wants to pay in USD, they pay gas fee to Dbilia first
        - then Dbilia triggers setForSaleWithUSD for them
        - if w3user wants to pay in ETH they can trigger setForSaleWithETH,
        - but msg.sender must have the ownership of token
     */

  /**
    * w2, w3user selling a token in USD
    *
    * Preconditions
    * 1. before we make this contract go live,
    * 2. trigger setApprovalForAll() from Dbilia EOA to approve this contract
    * 3. seller pays gas fee in USD
    * 4. trigger getTokenOwnership() and if tokenId belongs to w3user,
    * 5. call isApprovedForAll() first to check whether w3user has approved the contract on his behalf
    * 6. if not, w3user has to trigger setApprovalForAll() with his ETH to trigger setForSaleWithUSD()
    *
    * @param _tokenId token id to sell
    * @param _priceUSD price in USD to sell
    */
    function setForSaleWithUSD(uint256 _tokenId, uint256 _priceUSD) public isActive onlyDbilia {
        require(_tokenId > 0, "token id is zero or lower");
        require(tokenPriceUSD[_tokenId] == 0, "token has already been set for sale");
        require(_priceUSD > 0, "price is zero or lower");
        require(
            dbiliaToken.isApprovedForAll(dbiliaToken.dbiliaTrust(), address(this)),
            "Dbilia did not approve Marketplace contract"
        );
        tokenPriceUSD[_tokenId] = _priceUSD;
        emit SetForSale(_tokenId, _priceUSD, msg.sender, block.timestamp);
    }

    function removeSetForSaleUSD(uint256 _tokenId) public isActive onlyDbilia {
        require(_tokenId > 0, "token id is zero or lower");
        require(tokenPriceUSD[_tokenId] > 0, "token has not set for sale");
        require(
            dbiliaToken.isApprovedForAll(dbiliaToken.dbiliaTrust(), address(this)),
            "Dbilia did not approve Marketplace contract"
        );
        tokenPriceUSD[_tokenId] = 0;
        emit SetForSale(_tokenId, 0, msg.sender, block.timestamp);
    }

  /**
    * w3user selling a token in ETH
    *
    * Preconditions
    * 1. call isApprovedForAll() to check w3user has approved the contract on his behalf
    * 2. if not, trigger setApprovalForAll() from w3user
    *
    * @param _tokenId token id to sell
    * @param _priceUSD price in USD to sell
    */
    function setForSaleWithETH(uint256 _tokenId, uint256 _priceUSD) public isActive {
        require(_tokenId > 0, "token id is zero or lower");
        require(tokenPriceUSD[_tokenId] == 0, "token has already been set for sale");
        require(_priceUSD > 0, "price is zero or lower");
        address owner = dbiliaToken.ownerOf(_tokenId);
        require(owner == msg.sender, "caller is not a token owner");
        require(dbiliaToken.isApprovedForAll(msg.sender, address(this)),
                "token owner did not approve Marketplace contract"
        );
        tokenPriceUSD[_tokenId] = _priceUSD;
        emit SetForSale(_tokenId, _priceUSD, msg.sender, block.timestamp);
    }

    function removeSetForSaleETH(uint256 _tokenId) public isActive {
        require(_tokenId > 0, "token id is zero or lower");
        require(tokenPriceUSD[_tokenId] > 0, "token has not set for sale");
        address owner = dbiliaToken.ownerOf(_tokenId);
        require(owner == msg.sender, "caller is not a token owner");
        require(dbiliaToken.isApprovedForAll(msg.sender, address(this)),
                "token owner did not approve Marketplace contract"
        );
        tokenPriceUSD[_tokenId] = 0;
        emit SetForSale(_tokenId, 0, msg.sender, block.timestamp);
    }

  /**
    * w2user purchasing in USD
    * function triggered by Dbilia
    *
    * Preconditions
    * 1. call getTokenOwnership() to check whether seller is w2 or w3user holding the token
    * 2. if seller is w3user, call ownerOf() to check seller still holds the token
    * 3. call tokenPriceUSD() to get the price of token
    * 4. buyer pays 2.5% fee
    * 5. buyer pays gas fee
    * 6. check buyer paid in correct amount of USD (NFT price + 2.5% fee + gas fee)
    *
    * After purchase
    * 1. increase the seller's internal USD wallet balance
    *    - seller receives = (tokenPriceUSD - seller 2.5% fee - royalty)
    *    - for royalty, use royaltyReceivers(tokenId)
    * 2. increase the royalty receiver's internal USD wallet balance
    *    - for royalty, use royaltyReceivers(tokenId)
    *
    * @param _tokenId token id to buy
    * @param _buyerId buyer's w2user internal id
    */
    function purchaseWithUSDw2user(uint256 _tokenId, string memory _buyerId)
        public
        isActive
        onlyDbilia
    {
        require(tokenPriceUSD[_tokenId] > 0, "seller is not selling this token");
        require(bytes(_buyerId).length > 0, "buyerId Id is empty");

        address owner = dbiliaToken.ownerOf(_tokenId);
        (bool isW3user, address w3owner, string memory w2owner) = dbiliaToken.getTokenOwnership(_tokenId);

        if (isW3user) {
            require(owner == w3owner, "wrong owner");
            require(w3owner != address(0), "w3owner is empty");
            dbiliaToken.safeTransferFrom(w3owner, dbiliaToken.dbiliaTrust(), _tokenId);
            dbiliaToken.changeTokenOwnership(_tokenId, address(0), _buyerId);
            tokenPriceUSD[_tokenId] = 0;
        } else {
            require(owner == dbiliaToken.dbiliaTrust(), "wrong owner");
            require(bytes(w2owner).length > 0, "w2owner is empty");
            dbiliaToken.changeTokenOwnership(_tokenId, address(0), _buyerId);
            tokenPriceUSD[_tokenId] = 0;
        }

        emit PurchaseWithUSD(
            _tokenId,
            address(0),
            _buyerId,
            isW3user,
            w3owner,
            w2owner,
            block.timestamp
        );
    }

  /**
    * w3user purchasing in USD
    * function triggered by Dbilia
    *
    * Preconditions
    * 1. call getTokenOwnership() to check whether seller is w2 or w3user holding the token
    * 2. if seller is w3user, call ownerOf() to check seller still holds the token
    * 3. call tokenPriceUSD() to get the price of token
    * 4. buyer pays 2.5% fee
    * 5. buyer pays gas fee
    * 6. check buyer paid in correct amount of USD (NFT price + 2.5% fee + gas fee)
    *
    * After purchase
    * 1. increase the seller's internal USD wallet balance
    *    - seller receives = (tokenPriceUSD - seller 2.5% fee - royalty)
    *    - for royalty, use royaltyReceivers(tokenId)
    * 2. increase the royalty receiver's internal USD wallet balance
    *    - for royalty, use royaltyReceivers(tokenId)
    *
    * @param _tokenId token id to buy
    * @param _buyer buyer's w3user id
    */
    function purchaseWithUSDw3user(uint256 _tokenId, address _buyer)
        public
        isActive
        onlyDbilia
    {
        require(tokenPriceUSD[_tokenId] > 0, "seller is not selling this token");
        require(_buyer != address(0), "buyer address is empty");

        address owner = dbiliaToken.ownerOf(_tokenId);
        (bool isW3user, address w3owner, string memory w2owner) = dbiliaToken.getTokenOwnership(_tokenId);

        if (isW3user) {
            require(owner == w3owner, "wrong owner");
            require(w3owner != address(0), "w3owner is empty");
            dbiliaToken.safeTransferFrom(w3owner, _buyer, _tokenId);
            dbiliaToken.changeTokenOwnership(_tokenId, _buyer, "");
            tokenPriceUSD[_tokenId] = 0;
        } else {
            require(owner == dbiliaToken.dbiliaTrust(), "wrong owner");
            require(bytes(w2owner).length > 0, "w2owner is empty");
            dbiliaToken.safeTransferFrom(dbiliaToken.dbiliaTrust(), _buyer, _tokenId);
            dbiliaToken.changeTokenOwnership(_tokenId, _buyer, "");
            tokenPriceUSD[_tokenId] = 0;
        }

        emit PurchaseWithUSD(
            _tokenId,
            _buyer,
            "",
            isW3user,
            w3owner,
            w2owner,
            block.timestamp
        );
    }

  /**
    * w3user purchasing in ETH
    * function triggered by w3user
    *
    * Preconditions
    * 1. call getTokenOwnership() to check whether seller is w2 or w3user holding the token
    * 2. if seller is w3user, call ownerOf() to check seller still holds the token
    * 3. call tokenPriceUSD() to get the price of token
    * 4. do conversion and calculate how much buyer needs to pay in ETH
    * 5. add up buyer fee 2.5% in msg.value
    *
    * After purchase
    * 1. increase the seller's internal ETH wallet balance
    *    - seller receives = (tokenPriceUSD - seller 2.5% fee - royalty)
    *    - for royalty, use royaltyReceivers(tokenId)
    * 2. increase the royalty receiver's internal ETH wallet balance
    *    - for royalty, use royaltyReceivers(tokenId)
    *    - use royaltyAmount from its event
    *
    * @param _tokenId token id to buy
    */
    function purchaseWithETHw3user(uint256 _tokenId) public payable isActive {
        require(tokenPriceUSD[_tokenId] > 0, "seller is not selling this token");

        _validateAmount(_tokenId);

        address owner = dbiliaToken.ownerOf(_tokenId);
        (bool isW3user, address w3owner, string memory w2owner) = dbiliaToken.getTokenOwnership(_tokenId);

        if (isW3user) {
            require(owner == w3owner, "wrong owner");
            require(w3owner != address(0), "w3owner is empty");
            dbiliaToken.safeTransferFrom(w3owner, msg.sender, _tokenId);
            dbiliaToken.changeTokenOwnership(_tokenId, msg.sender, "");
            tokenPriceUSD[_tokenId] = 0;
        } else {
            require(owner == dbiliaToken.dbiliaTrust(), "wrong owner");
            require(bytes(w2owner).length > 0, "w2owner is empty");
            dbiliaToken.safeTransferFrom(dbiliaToken.dbiliaTrust(), msg.sender, _tokenId);
            dbiliaToken.changeTokenOwnership(_tokenId, msg.sender, "");
            tokenPriceUSD[_tokenId] = 0;
        }

        uint256 fee = _payBuyerSellerFee();
        uint256 royaltyAmount = _sendRoyalty(_tokenId);
        uint256 sellerReceiveAmount = msg.value.sub(fee.add(royaltyAmount));

        _sendToSeller(sellerReceiveAmount, isW3user, w3owner);

        emit PurchaseWithETH(
            _tokenId,
            msg.sender,
            isW3user,
            w3owner,
            w2owner,
            fee,
            royaltyAmount,
            sellerReceiveAmount,
            block.timestamp
        );
    }

  /**
    * Validate user purchasing in ETH matches with USD conversion using chainlink
    * checks buyer fee of the token price as well (i.e. 2.5%)
    *
    * @param _tokenId token id
    */
    function _validateAmount(uint256 _tokenId) private {
        uint256 tokenPrice = tokenPriceUSD[_tokenId];
        int256 currentPriceOfETHtoUSD = getCurrentPriceOfETHtoUSD();
        uint256 buyerFee = tokenPrice.mul(dbiliaToken.feePercent()).div(1000);
        uint256 buyerTotal = tokenPrice.add(buyerFee) * 10**18;
        uint256 buyerTotalToWei = buyerTotal.div(uint256(currentPriceOfETHtoUSD));
        require(msg.value >= buyerTotalToWei, "not enough of ETH being sent");
    }

  /**
    * Pay flat fees to Dbilia
    * i.e. buyer fee + seller fee = 5%
    */
    function _payBuyerSellerFee() private returns (uint256) {
        uint256 feePercent = dbiliaToken.feePercent();
        uint256 fee = msg.value.mul(feePercent.mul(2)).div(1000);
        _send(fee, dbiliaToken.dbiliaTrust());
        return fee;
    }

  /**
    * Pay royalty to creator
    * Dbilia receives on creator's behalf
    *
    * @param _tokenId token id
    */
    function _sendRoyalty(uint256 _tokenId) private returns (uint256) {
        (, uint8 percentage) = dbiliaToken.getRoyaltyReceiver(_tokenId);
         uint256 royalty = msg.value.mul(percentage).div(1000);
        _send(royalty, dbiliaToken.dbiliaTrust());
        return royalty;
    }

  /**
    * Send money to seller
    * Dbilia keeps it if seller is w2user
    *
    * @param sellerReceiveAmount total - (fee + royalty)
    * @param _isW3user w3user or w3user
    * @param _w3owner w3user EOA
    */
    function _sendToSeller(
        uint256 sellerReceiveAmount,
        bool _isW3user,
        address _w3owner
    )
        private
    {
        _send(sellerReceiveAmount, _isW3user ? _w3owner : dbiliaToken.dbiliaTrust());
    }

  /**
    * Low-level call methods instead of using transfer()
    *
    * @param _amount amount in ETH
    * @param _to receiver
    */
    function _send(uint256 _amount, address _to) private {
        (bool success, ) = _to.call{value:_amount}("");
        require(success, "Transfer failed.");
    }

  /**
    * Get current price of ETH to USD
    *
    */
    function getCurrentPriceOfETHtoUSD() public view returns (int256) {
        return getThePrice() / 10 ** 8;
    }
}
