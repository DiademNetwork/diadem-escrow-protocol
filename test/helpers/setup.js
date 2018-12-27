const expect = require("chai")
  .use(require("chai-as-promised"))
  .expect;

const expectFail = async (promise, message = 'revert') => {
  try {
    await promise;
  } catch (error) {
    expect(error.message).to.include(message);
    return;
  }
  expect.fail(`Expected failure with message: ${message}`)
}

module.exports = { expect, expectFail }
