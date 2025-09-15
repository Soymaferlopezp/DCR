// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SomniaDevLog {
    /// @notice kind: 0 = owner ping, 1 = public ping
    enum PingKind { Owner, Public }

    /// @dev dev y contractAddress indexados para facilitar el indexado
    event ContractRegistered(address indexed dev, address indexed contractAddress, string name);
    event DevPing(address indexed dev, address indexed contractUsed, uint8 kind);

    // dev => lista de contratos registrados
    mapping(address => address[]) private _byDev;
    // dev => contrato => bool (para validación rápida)
    mapping(address => mapping(address => bool)) public isRegisteredByDev;
    // nombre opcional (dev => contrato => name)
    mapping(address => mapping(address => string)) public names;

    function registerMyContract(string calldata name, address contractAddress) external {
        require(contractAddress != address(0), "invalid address");
        if (!isRegisteredByDev[msg.sender][contractAddress]) {
            isRegisteredByDev[msg.sender][contractAddress] = true;
            _byDev[msg.sender].push(contractAddress);
        }
        names[msg.sender][contractAddress] = name;
        emit ContractRegistered(msg.sender, contractAddress, name);
    }

    /// @notice kind 0=Owner requiere que el contrato haya sido registrado por el dev que hace el ping
    function ping(address contractUsed, uint8 kind) external {
        require(contractUsed != address(0), "invalid address");
        require(kind <= uint8(PingKind.Public), "invalid kind");
        if (PingKind(kind) == PingKind.Owner) {
            require(isRegisteredByDev[msg.sender][contractUsed], "not owner-registered");
        }
        emit DevPing(msg.sender, contractUsed, kind);
    }

    function getMyContracts() external view returns (address[] memory addrs, string[] memory labels) {
        address[] memory list = _byDev[msg.sender];
        string[] memory out = new string[](list.length);
        for (uint256 i = 0; i < list.length; i++) {
            out[i] = names[msg.sender][list[i]];
        }
        return (list, out);
    }
}
