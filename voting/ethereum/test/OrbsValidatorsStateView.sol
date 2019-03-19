pragma solidity 0.5.3;

import "./../contracts/OrbsValidators.sol";

contract OrbsValidatorsStateView is OrbsValidators {
    constructor(address registry_, uint validatorLimit_)
        OrbsValidators(msg.sender, 100) public {
    }

    function getApprovedValidatorAt(uint index) public view returns (address) {
        return approvedValidators[index];
    }
}