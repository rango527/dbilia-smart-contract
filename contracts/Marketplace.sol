// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DbiliaToken.sol";
import "./PriceConsumerV3.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

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
    event PurchaseTokenWithUSD(
        uint256 _tokenId, 
        address indexed _buyer,
        string _objectId,
        bool _isW3user,
        uint256 _timestamp
    );
    event PurchaseTokenWithETH(
        uint256 _tokenId, 
        address indexed _buyer,
        uint256 _timestamp
    );
    event FlatFee(
        uint256 _tokenId, 
        address indexed _sender, 
        uint256 _feeAmount, 
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
        require(tokenPriceUSD[_tokenId] == 0, "token has already been set for sale");
        require(_tokenId > 0, "token id is zero or lower");
        require(_priceUSD > 0, "price is zero or lower");
        require(
            dbiliaToken.isApprovedForAll(dbiliaToken.dbiliaTrust(), address(this)),
            "Dbilia did not approve Marketplace contract"
        );        
        tokenPriceUSD[_tokenId] = _priceUSD;   
        emit SetForSale(_tokenId, _priceUSD, msg.sender, block.timestamp);
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
        require(tokenPriceUSD[_tokenId] == 0, "token has already been set for sale");
        require(_tokenId > 0, "token id is zero or lower");
        require(_priceUSD > 0, "price is zero or lower");
        address owner = dbiliaToken.ownerOf(_tokenId);    
        require(owner == msg.sender, "caller is not a token owner");
        require(dbiliaToken.isApprovedForAll(msg.sender, address(this)), 
                "token owner did not approve Marketplace contract"
        );       
        tokenPriceUSD[_tokenId] = _priceUSD;
        emit SetForSale(_tokenId, _priceUSD, msg.sender, block.timestamp);
    }

  /**
    * w2user purchasing in USD 
    * function triggered by Dbilia
    *
    * Preconditions
    * 1. call getTokenOwnership() to check whether seller is w2 or w3user holding the token
    * 2. if seller is w3user, call ownerOf() to check seller still holds the token
    * 2. call tokenPriceUSD() to get the price of token
    * 3. buyer pays 2.5% fee
    * 4. buyer pays gas fee
    * 5. check buyer paid in correct amount of USD (NFT price + 2.5% fee + gas fee)
    *
    * After purchase
    * i.e. seller receives = (tokenPriceUSD - seller 2.5% fee - royalty)
    * 1. increase the seller's internal USD wallet balance
    * 2. increase the royalty receiver's internal USD wallet balance
    *
    * @param _tokenId token id to buy
    * @param _buyerId buyer's w2user internal id
    */
    function purchaseTokenWithUSDw2user(uint256 _tokenId, string memory _buyerId) 
        public 
        isActive
        onlyDbilia    
    {       
        require(tokenPriceUSD[_tokenId] > 0, "seller not selling this token");
        require(bytes(_buyerId).length > 0, "_buyerId Id is empty");

        (bool isW3user, address w3owner, string memory w2owner) = dbiliaToken.getTokenOwnership(_tokenId); 

        if (isW3user) {
            address owner = dbiliaToken.ownerOf(_tokenId);
            require(owner == w3owner, "wrong owner");
            require(w3owner != address(0), "buyer EOA is empty");
            dbiliaToken.safeTransferFrom(w3owner, dbiliaToken.dbiliaTrust(), _tokenId);
            dbiliaToken.changeTokenOwnership(_tokenId, address(0), _buyerId);
            tokenPriceUSD[_tokenId] = 0;
        } else {

        }      

        //address owner = dbiliaToken.ownerOf(_tokenId);
        // // seller paid in USD which means token holder is dbilia
        // if (owner == dbiliaToken.owner() || owner == dbiliaToken.dbiliaTrust()) {
        //     string memory tokenOwner = dbiliaToken.tokenOwner(_tokenId);
        //     // confirm seller holds the token
        //     require(bytes(tokenOwner).length > 0, "tokenId doesn't belong to seller");
        //     // w3user buying
        //     // transfer token from dbilia EOA to w3user's EOA
        //     // remove w2user's token ownership
        //     // remove price mapped to token
        //     if (_isW3user) {
        //         require(_buyer != address(0), "buyer EOA is empty");
        //         require(_buyer != owner, "owner cannot buy his own");
        //         dbiliaToken.safeTransferFrom(dbiliaToken.dbiliaTrust(), _buyer, _tokenId);
        //         dbiliaToken.changeW2userOwnership(_tokenId, "");
        //         tokenPriceUSD[_tokenId] = 0;
        //     // w2user buying
        //     // dbilia keeps holding the token, but change the w2user ownership of token
        //     } else {
        //         require(bytes(_buyerId).length > 0, "object Id is empty");
        //         require(
        //             bytes(dbiliaToken.tokenOwner(_tokenId)).length > 0, 
        //             "tokenOwner is empty"
        //         );
        //         require(
        //             keccak256(bytes(_buyerId)) != 
        //             keccak256(bytes(dbiliaToken.tokenOwner(_tokenId))), 
        //             "owner cannot buy his own"
        //         );
        //         dbiliaToken.changeW2userOwnership(_tokenId, _buyerId);
        //         tokenPriceUSD[_tokenId] = 0;
        //     }
        // // seller is w3user who paid in ETH
        // } else {
        //     // w3user buying
        //     if (_isW3user) {
        //         require(_buyer != address(0), "buyer EOA is empty");
        //         require(_buyer != owner, "owner cannot buy his own");
        //         dbiliaToken.safeTransferFrom(owner, _buyer, _tokenId);
        //         dbiliaToken.changeW2userOwnership(_tokenId, "");                
        //         tokenPriceUSD[_tokenId] = 0;
        //     // w2user buying
        //     // send the token to dbilia EOA
        //     } else {
        //         require(bytes(_buyerId).length > 0, "object Id is empty");
        //         dbiliaToken.safeTransferFrom(owner, dbiliaToken.dbiliaTrust(), _tokenId);
        //         dbiliaToken.changeW2userOwnership(_tokenId, _buyerId);
        //         tokenPriceUSD[_tokenId] = 0;
        //     }
        // }    

        emit PurchaseTokenWithUSD(_tokenId, _buyer, _buyerId, _isW3user, block.timestamp);  
    }

  /**
    * w3user purchasing in ETH 
    * function triggered by w3user
    *
    * Precondition
    * 1. add up buyer fee 2.5% in msg.value
    *
    * @param _tokenId token id to buy
    */
    function purchaseTokenWithETH(uint256 _tokenId) public payable isActive {   
        require(tokenPriceUSD[_tokenId] > 0, "seller not selling this token");
    
        _validateETHtoUSD(_tokenId);

        address owner = dbiliaToken.ownerOf(_tokenId);  
        // seller paid in USD which means token holder is dbilia
        if (owner == dbiliaToken.owner() || owner == dbiliaToken.dbiliaTrust()) {
            string memory tokenOwner = dbiliaToken.tokenOwner(_tokenId);
            // confirm seller holds the token
            require(bytes(tokenOwner).length > 0, "tokenId doesn't belong to seller");
            // transfer token from dbilia EOA to w3user's EOA
            // remove w2user's token ownership
            // remove price mapped to token
            dbiliaToken.safeTransferFrom(dbiliaToken.dbiliaTrust(), msg.sender, _tokenId);
            dbiliaToken.changeW2userOwnership(_tokenId, "");
            tokenPriceUSD[_tokenId] = 0;
        // seller is w3user who paid in ETH
        } else {
            dbiliaToken.safeTransferFrom(owner, msg.sender, _tokenId);
            dbiliaToken.changeW2userOwnership(_tokenId, "");                
            tokenPriceUSD[_tokenId] = 0;     
        }    
        
        // pay royalty
        // pay buyer fee
        _payFlatFee(_tokenId, msg.value);
        // pay seller fee
        _payFlatFee(_tokenId, msg.value);
        
        emit PurchaseTokenWithETH(_tokenId, msg.sender, block.timestamp);
    }

  /**
    * Validate user purchasing in ETH matches with USD conversion using chainlink
    *
    * @param _tokenId token id
    */
    function _validateETHtoUSD(uint256 _tokenId) private {
        uint256 tokenPrice = tokenPriceUSD[_tokenId];              
        // price of 1 ETH in USD
        int256 currentPriceOfETHtoUSD = getThePrice() / 10 ** 8;
        require(msg.value >= tokenPrice / uint256(currentPriceOfETHtoUSD), "not enough of ETH being sent");
    }  

  /**
    * Pay flat fee from w3user to Dbilia
    *
    * @param _tokenId token id
    * @param _price price of NFT converted to ETH
    */
    function _payFlatFee(uint256 _tokenId, uint256 _price) private {
        require(_tokenId > 0, "token id is zero or lower");
        require(_price > 0, "price is zero or lower");
        uint256 feeAmount = _price.mul(dbiliaToken.feePercent()).div(1000);
        require(msg.value >= feeAmount, "caller sent fee lower than feeAmount");
        _send(feeAmount, dbiliaToken.dbiliaTrust());
        emit FlatFee(_tokenId, msg.sender, feeAmount, block.timestamp);
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
}