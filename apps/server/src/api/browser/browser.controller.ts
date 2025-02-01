import { Request, Response } from 'express';
import { BrowserAgent } from '../../agents/browser/browser.agent.js';

export const browserController = {
  async navigateToGoogle(req: Request, res: Response) {
    const agent = new BrowserAgent();
    
    try {
      await agent.initialize();
      const results = await agent.executeTask('Navigate to google.com');
      res.json({ 
        success: true, 
        results 
      });
    } catch (error: any) {
      console.error('Browser navigation error:', error);
      
      // Determine if this is a known error type
      const isCreditsError = error.message.includes('Insufficient credits');
      
      res.status(isCreditsError ? 402 : 500).json({
        success: false,
        error: error.message,
        type: isCreditsError ? 'INSUFFICIENT_CREDITS' : 'EXECUTION_ERROR',
        ...(isCreditsError && {
          resolution: 'Please add credits to your Anthropic account at https://console.anthropic.com'
        })
      });
    } finally {
      await agent.cleanup();
    }
  }
};
