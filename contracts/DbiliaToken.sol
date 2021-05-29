// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-solidity/contracts/utils/Counters.sol";
import "./AccessControl.sol";
import "hardhat/console.sol";

// contract deployer is CEO's EOA
// CEO adds Dbilia EOA in AccessControl
// CEO adds Marketplace contract in AccessControl
// Dbilia EOA does all the essential calls
// CEO is a master account who can halt smart contract and 
// remove Dbilia EOA and Marketplace EOA just in case something happens

contract DbiliaToken is ERC721URIStorage, AccessControl {
  using Counters for Counters.Counter;
  
  Counters.Counter private _tokenIds;
  uint32 public constant EDITION_MAX = type(uint32).max;
  uint256 public feePercent;

  // Track royalty receiving address
  mapping (uint256 => string) public royaltyReceivers;
  // Track w2user's token ownership
  mapping (uint256 => string) public tokenOwner;
  // Make sure no duplicate is created per product/edition
  mapping (string => mapping(uint32 => uint256)) public productEditions;

  // Events
  event MintWithUSD(
    uint256 _tokenId, 
    string _royaltyReceiverId,
    string _minterId,
    string _productId, 
    uint32 _edition, 
    uint256 _timestamp
  );  
  event MintWithETH(
    uint256 _tokenId, 
    string _royaltyReceiverId,
    address _minterAddress, 
    string _productId, 
    uint32 _edition, 
    uint256 _timestamp
  );  

  /**
    * Constructor
    *
    * Define the owner of the contract
    * Set Dbilia token name and symbol
    * Set initial fee percentage which is 2.5%
    *
    * @param _name Dbilia token name
    * @param _symbol Dbilia token symbol
    * @param _feePercent fee percentage Dbilia account will receive
    */
  constructor(
    string memory _name, 
    string memory _symbol,
    uint256 _feePercent
  ) 
    ERC721(_name, _symbol) 
    {
      feePercent = _feePercent;
    }

  /**
    * Minting paid with USD from w2user, w3user
    *
    * Precondition
    * 1. user pays gas fee to Dbilia in USD
    *
    * @param _royaltyReceiverId internal id of creator of card
    * @param _minterId w2user minter's internal id
    * @param _productId product id
    * @param _edition edition number
    * @param _tokenURI token uri stored in IPFS
    */
  function mintWithUSD(
    string memory _royaltyReceiverId,
    string memory _minterId,
    string memory _productId,
    uint32 _edition,
    string memory _tokenURI
  )
    public
    isActive
    onlyDbilia
  {
    require(bytes(_royaltyReceiverId).length > 0, "royalty receiver id is empty");
    require(bytes(_minterId).length > 0, "minter id is empty");
    require(bytes(_productId).length > 0, "product id is empty");
    require(
      _edition >= 0 && _edition <= EDITION_MAX, 
      "edition number is empty or exceeded uint32 max"
    );
    require(bytes(_tokenURI).length > 0, "token uri is empty");    
    require(
      productEditions[_productId][_edition] == 0, 
      "product edition has already been created"
    );

    _tokenIds.increment();

    uint256 newTokenId = _tokenIds.current(); 
    // Track the creator of card
    royaltyReceivers[newTokenId] = _royaltyReceiverId;
    // Track the owner of token
    tokenOwner[newTokenId] = _minterId;
    // productId and edition are mapped to new token
    productEditions[_productId][_edition] = newTokenId;    
    // Dbilia keeps the token on minter's behalf
    _mint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, _tokenURI);

    emit MintWithUSD(newTokenId, _royaltyReceiverId, _minterId, _productId, _edition, block.timestamp);
  }  

  /**
    * Minting paid with ETH from w3user
    *
    * @param _royaltyReceiverId internal id of creator of card
    * @param _productId product id
    * @param _edition edition number
    * @param _tokenURI token uri stored in IPFS
    */
  function mintWithETH(
    string memory _royaltyReceiverId,
    string memory _productId,
    uint32 _edition,
    string memory _tokenURI
  )
    public
    isActive
  {
    require(bytes(_royaltyReceiverId).length > 0, "royalty receiver id is empty");
    require(bytes(_productId).length > 0, "product id is empty");
    require(
      _edition >= 0 && _edition <= EDITION_MAX, 
      "edition number is empty or exceeded uint32 max"
    );
    require(bytes(_tokenURI).length > 0, "token uri is empty");    
    require(
      productEditions[_productId][_edition] == 0, 
      "product edition has already been created"
    );

    _tokenIds.increment();

    uint256 newTokenId = _tokenIds.current();   
    // Track the creator of card
    royaltyReceivers[newTokenId] = _royaltyReceiverId;
    // productId and edition are mapped to new token
    productEditions[_productId][_edition] = newTokenId;    

    _mint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, _tokenURI);

    emit MintWithETH(newTokenId, _royaltyReceiverId, msg.sender, _productId, _edition, block.timestamp);
  }  

  /**
    * Set flat fee by Dbilia
    * Only CEO can set it
    *
    * @param _feePercent new fee percent
    */
  function setFlatFee(uint256 _feePercent)
    public
    onlyCEO
    returns (bool)
  {
    feePercent = _feePercent;
    return true;
  }  

  /**
    * Change w2user's ownership of token
    * Only Dbilia can set it
    *
    * @param _tokenId token id
    * @param _objectId w2user's internal id
    */
  function changeW2userOwnership(uint256 _tokenId, string memory _objectId)
    public
    isActive
    onlyDbilia
    returns (bool)
  {
    tokenOwner[_tokenId] = _objectId;
    return true;
  }  

  /**
    * Check product edition has already been minted
    *
    * @param _productId product id
    * @param _edition edition
    */
  function isProductEditionMinted(string memory _productId, uint32 _edition) public view returns (bool) {
    if (productEditions[_productId][_edition] > 0) {
      return true;
    }
    return false;
  }
}