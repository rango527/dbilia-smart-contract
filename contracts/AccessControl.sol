// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AccessControl {
    address public owner;
    address public dbiliaTrust;
    address public marketplace;
    bool public isMaintaining = false;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyCEO {
        require(msg.sender == owner, "caller is not CEO");
        _;
    }

    modifier isActive {
        require(!isMaintaining, "it's currently maintaining");
        _;
    }

    modifier onlyDbilia() {
        require(msg.sender == owner || msg.sender == dbiliaTrust || msg.sender == marketplace, "caller is not one of Dbilia accounts");
        _;
    }

    function changeOwner(address _newOwner) onlyCEO public {
        if (_newOwner != address(0)) {
            owner = _newOwner;
        }
    }

    function changeDbiliaTrust(address _newDbiliaTrust) onlyCEO public {
        if (_newDbiliaTrust != address(0)) {
            dbiliaTrust = _newDbiliaTrust;
        }
    }
    
    function changeMarketplace(address _newMarketplace) onlyCEO public {
        if (_newMarketplace != address(0)) {
            marketplace = _newMarketplace;
        }
    }

    function updateMaintaining(bool _isMaintaining) onlyCEO public {
        isMaintaining = _isMaintaining;
    }
}