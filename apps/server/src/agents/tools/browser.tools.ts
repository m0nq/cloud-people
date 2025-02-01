import { Page } from 'playwright';

export class BrowserTools {
  constructor(private page: Page) {}

  async navigate(url: string): Promise<string> {
    await this.page.goto(url);
    return `Navigated to ${url}`;
  }

  async clickElement(selector: string): Promise<string> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible' });
      await this.page.click(selector);
      return `Clicked element ${selector}`;
    } catch (error) {
      throw new Error(
        `Failed to click element ${selector}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async readText(selector: string): Promise<string> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible' });
      const text = await this.page.textContent(selector);
      return text || 'No text found';
    } catch (error) {
      throw new Error(
        `Failed to read text from ${selector}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async typeText(selector: string, text: string): Promise<string> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible' });
      await this.page.fill(selector, text);
      return `Typed "${text}" into ${selector}`;
    } catch (error) {
      throw new Error(
        `Failed to type text into ${selector}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async takeScreenshot(): Promise<Buffer> {
    return await this.page.screenshot();
  }
}
