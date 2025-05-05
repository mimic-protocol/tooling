// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Test {
    enum Status { Pending, Active, Inactive }

    function getUint() external pure returns (uint256) {
        return 123;
    }

    function getInt() external pure returns (int256) {
        return -123;
    }

    function getBool() external pure returns (bool) {
        return true;
    }

    function getCallerAddress() external view returns (address) {
        return msg.sender;
    }

    function getBytes32() external pure returns (bytes32) {
        return keccak256(abi.encodePacked("test"));
    }

    function getEnum() external pure returns (Status) {
        return Status.Active;
    }

    function getString() external pure returns (string memory) {
        return "Hello, Remix!";
    }

    function getBytes() external pure returns (bytes memory) {
        return hex"123456";
    }

    function getUintArray() external pure returns (uint256[] memory) {
        uint256[] memory arr = new uint256[](3);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        return arr;
    }

    function getFixedUintArray() external pure returns (uint256[3] memory) {
        uint256[3] memory arr;
        arr[0] = 1;
        arr[1] = 2;
        arr[2] = 3;
        return arr;
    }

    function getStringArray() external pure returns (string[] memory) {
        string[] memory arr = new string[](2);
        arr[0] = "foo";
        arr[1] = "bar";
        return arr;
    }

    function getMultipleValues() external pure returns (uint256, bool, string memory) {
        return (100, false, "Multiple");
    }

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

    function readAddress(address _addr) external pure returns (address) {
        return _addr;
    }

    function readFixedAddressArray(address[3] memory _addrs) external pure returns (address) {
        return _addrs[0];
    }

    function readDynamicAddressArray(address[] memory _addrs) external pure returns (uint256) {
        return _addrs.length;
    }

    function readDynamicStringArray(string[] memory _strings) external pure returns (string memory) {
        if (_strings.length == 0) return "";
        return _strings[0];
    }

    function readFixedStringArray(string[2] memory _strings) external pure returns (string memory) {
        return _strings[0];
    }

    function readBytes8(bytes8 _input) external pure returns (bytes8) {
        return _input;
    }

    function readBytes16(bytes16 _input) external pure returns (bytes16) {
        return _input;
    }

    struct MyStruct {
        uint256 id;
        string name;
        int256 value;
    }

    function getIntArray(int256 input) external pure returns (int256[] memory arr) {
        arr = new int256[](3);
        arr[0] = input;
        arr[1] = -input;
        arr[2] = -1;
        return arr;
    }

    function echoStruct(MyStruct memory s) external pure returns (MyStruct memory copia) {
        copia = s;
    }

    function createStruct(
        uint256 id,
        string memory name,
        int256 value
    ) external pure returns (MyStruct memory s) {
        s = MyStruct({ id: id, name: name, value: value });
    }
}
