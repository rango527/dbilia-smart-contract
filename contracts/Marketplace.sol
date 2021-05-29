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
    * w2user, w3user selling a token in USD
    *
    * Preconditions
    * 1. before we make this contract go live,
    * 2. trigger setApprovalForAll() from Dbilia EOA to approve this contract
    * 3. seller pays gas fee in USD
    *
    * @param _tokenId token id to sell
    * @param _priceUSD price in USD to sell
    */
    function setForSaleWithUSD(
        uint256 _tokenId, 
        uint256 _priceUSD
    ) 
        public 
        isActive 
        onlyDbilia 
    {  
        require(tokenPriceUSD[_tokenId] == 0, "token has already been set for sale");
        require(_tokenId > 0, "token id is zero or lower");
        require(_priceUSD > 0, "price is zero or lower");
        address owner = dbiliaToken.ownerOf(_tokenId);  
        require(
            owner == dbiliaToken.owner() || 
            owner == dbiliaToken.dbiliaTrust(),
            "caller is not one of dbilia accounts"
        );
        require(
            dbiliaToken.isApprovedForAll(owner, address(this)),
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
    * w2user, w3user purchasing in USD 
    * function triggered by Dbilia
    *
    * Preconditions
    * 1. call tokenOwner() to check w2user holding the token
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
    * @param _buyer (optional) buyer's w3user EOA
    * @param _objectId (optional) buyer's w2user internal id
    * @param _isW3user whether buyer is w2user or w3user
    */
    function purchaseTokenWithUSD(
        uint256 _tokenId, 
        address _buyer,
        string memory _objectId,
        bool _isW3user
    ) 
        public 
        isActive
        onlyDbilia    
    {       
        require(tokenPriceUSD[_tokenId] > 0, "seller not selling this token");
        address owner = dbiliaToken.ownerOf(_tokenId);
        // seller paid in USD which means token holder is dbilia
        if (owner == dbiliaToken.owner() || owner == dbiliaToken.dbiliaTrust()) {
            string memory tokenOwner = dbiliaToken.tokenOwner(_tokenId);
            // confirm seller holds the token
            require(bytes(tokenOwner).length > 0, "tokenId doesn't belong to seller");
            // w3user buying
            // transfer token from dbilia EOA to w3user's EOA
            // remove w2user's token ownership
            // remove price mapped to token
            if (_isW3user) {
                require(_buyer != address(0), "buyer EOA is empty");
                require(_buyer != owner, "owner cannot buy his own");
                dbiliaToken.safeTransferFrom(dbiliaToken.dbiliaTrust(), _buyer, _tokenId);
                dbiliaToken.changeW2userOwnership(_tokenId, "");
                tokenPriceUSD[_tokenId] = 0;
            // w2user buying
            // dbilia keeps holding the token, but change the w2user ownership of token
            } else {
                require(bytes(_objectId).length > 0, "object Id is empty");
                require(
                    bytes(dbiliaToken.tokenOwner(_tokenId)).length > 0, 
                    "tokenOwner is empty"
                );
                require(
                    keccak256(bytes(_objectId)) != 
                    keccak256(bytes(dbiliaToken.tokenOwner(_tokenId))), 
                    "owner cannot buy his own"
                );
                dbiliaToken.changeW2userOwnership(_tokenId, _objectId);
                tokenPriceUSD[_tokenId] = 0;
            }
        // seller is w3user who paid in ETH
        } else {
            // w3user buying
            if (_isW3user) {
                require(_buyer != address(0), "buyer EOA is empty");
                require(_buyer != owner, "owner cannot buy his own");
                dbiliaToken.safeTransferFrom(owner, _buyer, _tokenId);
                dbiliaToken.changeW2userOwnership(_tokenId, "");                
                tokenPriceUSD[_tokenId] = 0;
            // w2user buying
            // send the token to dbilia EOA
            } else {
                require(bytes(_objectId).length > 0, "object Id is empty");
                dbiliaToken.safeTransferFrom(owner, dbiliaToken.dbiliaTrust(), _tokenId);
                dbiliaToken.changeW2userOwnership(_tokenId, _objectId);
                tokenPriceUSD[_tokenId] = 0;
            }
        }    

        emit PurchaseTokenWithUSD(_tokenId, _buyer, _objectId, _isW3user, block.timestamp);  
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