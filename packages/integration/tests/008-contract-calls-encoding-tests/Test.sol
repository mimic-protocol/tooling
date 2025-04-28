// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Test {
    // Enum example
    enum Status { Pending, Active, Inactive }

    // Example state variable
    uint256 private number = 42;

    // ------- Basic Types --------
    function getUint() external pure returns (uint256) {
        return 123;
    }

    function getInt() external pure returns (int256) {
        return -123;
    }

    function getBool() external pure returns (bool) {
        return true;
    }

    function getAddress() external view returns (address) {
        return msg.sender;
    }

    function getBytes32() external pure returns (bytes32) {
        return keccak256(abi.encodePacked("test"));
    }

    function getEnum() external pure returns (Status) {
        return Status.Active;
    }

    // ------- Dynamic Types --------
    function getString() external pure returns (string memory) {
        return "Hello, Remix!";
    }

    function getBytes() external pure returns (bytes memory) {
        return hex"123456";
    }

    // ------- Arrays --------
    function getUintArray() external pure returns (uint256[] memory) {
        uint256[] memory arr = new uint256[](3);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        return arr;
    }

    function getFixedUintArray() external pure returns (uint256[3] memory) {
        return [uint256(1), 2, 3];
    }

    function getStringArray() external pure returns (string[] memory) {
        string[] memory arr = new string[](2);
        arr[0] = "foo";
        arr[1] = "bar";
        return arr;
    }

    // ------- Multiple Returns --------
    function getMultipleValues() external pure returns (uint256, bool, string memory) {
        return (100, false, "Multiple");
    }

    // ------- Functions with Parameters --------
    function echoUint(uint256 value) external pure returns (uint256) {
        return value;
    }

    function concatStrings(string memory a, string memory b) external pure returns (string memory) {
        return string(abi.encodePacked(a, b));
    }

    function sumArray(uint256[] memory values) external pure returns (uint256 sum) {
        for (uint256 i = 0; i < values.length; i++) {
            sum += values[i];
        }
    }

    function getElement(bytes32[3] memory arr, uint256 index) external pure returns (bytes32) {
        require(index < 3, "Index out of bounds");
        return arr[index];
    }

    function getStatusName(Status status) external pure returns (string memory) {
        if (status == Status.Pending) return "Pending";
        if (status == Status.Active) return "Active";
        return "Inactive";
    }

    // ------- Complex Combinations --------
    function processTransactionData(
        address user,
        uint256 amount,
        string memory note,
        bytes memory data
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, amount, note, data));
    }

    function reverseBytes(bytes memory input) external pure returns (bytes memory) {
        bytes memory output = new bytes(input.length);
        for (uint256 i = 0; i < input.length; i++) {
            output[i] = input[input.length - 1 - i];
        }
        return output;
    }
}
