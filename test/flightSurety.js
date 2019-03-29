var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

  it(`(security) caller not authorized`,async function () {
    let result = await config.flightSuretyData.isAuthorizedCaller(config.flightSuretyApp.address);
    assert.equal(result, false, "Caller is authorized although was not been registered.");
  });

  it(`(security) caller authorized`,async function () {
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    let result = await config.flightSuretyData.isAuthorizedCaller(config.flightSuretyApp.address);
    assert.equal(result, true, "Caller is not authorized although was registered.");
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(initial) first airline is registered when contract is deployed.`, async function () {
      let result = await config.flightSuretyData.isAirline.call(config.firstAirline);
      assert.equal(result, true, "First airline not registred on deployment");
  });

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      let status = true;
      try
      {
          status = await config.flightSuretyApp.isOperational.call();
          await config.flightSuretyApp.registerFlight();
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");
      assert.equal(status, false, "Contract is operational");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    let reverted = false;
    try {
        await config.flightSuretyApp.registerAirline.call(newAirline, {from: config.firstAirline});
    }
    catch(e) {
        reverted = true;
    }

    // ASSERT
    assert.equal(reverted, true, "Airline should not be able to register another airline if it hasn't provided funding");
  });


  it('(airline) can register an Airline if it is funded', async () => {
    let fund = await config.flightSuretyApp.AIRLINE_SEED_FUND.call();
    await config.flightSuretyApp.fund({from: config.firstAirline, value: fund.toString(), gasPrice: 0});

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    let reverted = false;
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
        reverted = true;
    }

    // ASSERT
    assert.equal(reverted, false, "Airline should be able to register another airline");
  });

  
  it('(airline) Only existing airline may register a new airline until there are at least four airlines registered', async () => {

    // ARRANGE    
    let newAirline2 = accounts[3];
    let newAirline3 = accounts[4];
    let newAirline4 = accounts[5];

    // ACT
    let revert = true;

    try {
        await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(newAirline3, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(newAirline4, {from: config.firstAirline});
    }
    catch(e) {
      revert = false;
    }

    // ASSERT
    assert.equal(revert, true, "Can not register Airlines");
  });

  it('(airline) add fund to airlines', async () => {

    // ARRANGE
    let fund = await config.flightSuretyApp.AIRLINE_SEED_FUND.call();

    let newAirline = accounts[2];
    let newAirline2 = accounts[3];
    let newAirline3 = accounts[4];

    // ACT
    let rejected = false;

    try {
        await config.flightSuretyApp.fund({from: newAirline, value: fund.toString(), gasPrice: 0});
        await config.flightSuretyApp.fund({from: newAirline2, value: fund.toString(), gasPrice: 0});
        await config.flightSuretyApp.fund({from: newAirline3, value: fund.toString(), gasPrice: 0});
    }
    catch(e) {
        rejected = true;
    }

    // ASSERT
    assert.equal(rejected, false, "Airlines not founded");
  });

  it('(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

    // ARRANGE
    let airline2 = accounts[2];
    let airline3 = accounts[3];
  
    let newAirline = accounts[6];


    await config.flightSuretyApp.registerAirline(newAirline, {from: airline2});
  
    let revert = false;
    try {
      await config.flightSuretyApp.registerAirline(newAirline, {from: airline2});
    } catch(e) {
      revert = true;
    }
    assert.equal(revert, true, "Multivote not rejected");

    await config.flightSuretyApp.registerAirline(newAirline, {from: airline3});
  });

});