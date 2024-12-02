// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseYoutube is ERC721, ERC721Enumerable, ERC721URIStorage {
    uint256 private _nextTokenId;
    uint256 private _transferCounter;
    mapping(address => uint256) private _creatorStartTokenId;

    constructor()
        ERC721("uToken", "UTK")
    {}

    function CreateNFT( uint256 num, string memory uri) public {
        _creatorStartTokenId[_msgSender()] = _nextTokenId;
        for (uint i = 0; i < num; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(_msgSender(), tokenId);
            _setTokenURI(tokenId, uri);
        }
    }

    function claimNFT(address creator) public {
        uint256 tokenId = _creatorStartTokenId[creator] + _transferCounter;
        require(tokenId < _nextTokenId, "All tokens have been transferred");
        require(ownerOf(tokenId) == creator, "Creator is not the current owner");
        require(_msgSender() != creator, "Caller is the creator");
        _transfer(creator, _msgSender(), tokenId);
        _transferCounter++;
    }

    // New function to check if an address owns any MTK tokens
    function ownsAnyUTK(address owner) public view returns (bool) {
        return balanceOf(owner) > 0;
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}