import { expect } from "chai";
import {
  By,
  VSBrowser,
  WebDriver,
  WebView,
  until,
} from "vscode-extension-tester";
import { GUIActions } from "../actions/GUI.actions";
import { DEFAULT_TIMEOUT } from "../constants";

describe("Login Page E2E Test", () => {
  let view: WebView;
  let driver: WebDriver;

  before(async function () {
    this.timeout(DEFAULT_TIMEOUT.XL);
    driver = VSBrowser.instance.driver;
    await GUIActions.moveContinueToSidebar(driver);
  });

  beforeEach(async function () {
    this.timeout(DEFAULT_TIMEOUT.XL);
    await GUIActions.toggleGui();
    ({ view, driver } = await GUIActions.switchToReactIframe());
  });

  afterEach(async function () {
    this.timeout(DEFAULT_TIMEOUT.XL);
    await view.switchBack();
  });

  it("未登录时应显示登录页面", async () => {
    // 检查是否有登录按钮
    const loginButton = await view.findWebElement(By.xpath("//button[text()='登录']"));
    expect(await loginButton.isDisplayed()).to.be.true;

    // 检查 Logo
    const logo = await view.findWebElement(By.xpath("//div[contains(@class, 'logo')]"));
    expect(await logo.isDisplayed()).to.be.true;

    // 检查介绍文案
    const description = await view.findWebElement(By.xpath("//h1[contains(text(), 'Continue 是领先的开源 AI 代码助手')]"));
    expect(await description.isDisplayed()).to.be.true;
  }).timeout(DEFAULT_TIMEOUT.XL);

  it("点击登录按钮应显示加载状态", async () => {
    const loginButton = await view.findWebElement(By.xpath("//button[text()='登录']"));
    await loginButton.click();

    // 检查文案是否变为 "登录中..."
    await driver.wait(until.elementTextIs(loginButton, "登录中..."), DEFAULT_TIMEOUT.MD);
    expect(await loginButton.isEnabled()).to.be.false;
  }).timeout(DEFAULT_TIMEOUT.XL);
});
