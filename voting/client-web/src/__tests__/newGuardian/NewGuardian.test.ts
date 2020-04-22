import { NewGuardianDriver } from './NewGuardianDriver';

describe('New Guardian', () => {
  let driver: NewGuardianDriver;

  beforeEach(() => {
    driver = new NewGuardianDriver();
  });

  it('should have submit button disabled', async () => {
    const { getByTestId } = await driver.render();
    expect(getByTestId('submit')).toBeDisabled();
  });

  it('should call register guardian', async () => {
    const info = {
      name: 'test',
      website: 'https://test.com',
    };
    const spy = jest.spyOn(driver.metaMask, 'registerGuardian');
    await driver.render();
    await driver.setName(info.name);
    await driver.setWebsite(info.website);
    await driver.submit();
    expect(spy).toHaveBeenCalledWith(info);
  });
});
