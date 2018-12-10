pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract OrbsTokenMock is ERC20 {
    function assign(address _account, uint256 _value) public {
        _burn(_account, balanceOf(_account));
        _mint(_account, _value);
    }
}
