pragma solidity 0.5.16;
import "./interfaces/IContractRegistry.sol";

contract ContractRegistry is IContractRegistry {

	address governor;

	mapping (string => address) contracts;

	event ContractAddressUpdated(string contractName, address addr);

	modifier onlyGovernor() {
		require(msg.sender == governor, "caller is the registry governor");

		_;
	}

	constructor(address _governor) public {
		governor = _governor;
	}

	function set(string calldata contractName, address addr) external onlyGovernor {
		require(addr != address(0), "address must not be zero");
		contracts[contractName] = addr;
		emit ContractAddressUpdated(contractName, addr);
	}

	function get(string calldata contractName) external view returns (address) {
		address addr = contracts[contractName];
		require(addr != address(0), "the contract name is not registered");
		return addr;
	}
}
