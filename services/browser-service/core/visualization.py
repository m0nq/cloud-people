import os
import gradio as gr
import logging
from typing import Optional, Dict, Any
from PIL import Image
import imageio
from datetime import datetime

logger = logging.getLogger(__name__)

class BrowserVisualization:
    """Class for managing browser visualization features"""
    
    def __init__(self, screenshots_dir: str, recordings_dir: str):
        self.screenshots_dir = screenshots_dir
        self.recordings_dir = recordings_dir
        self.interface = None
    
    def get_screenshot_gallery(self, _=None):
        """Get recent screenshots for gallery view"""
        try:
            screenshots = [f for f in os.listdir(self.screenshots_dir) if f.endswith('.png')]
            screenshots.sort(key=lambda x: os.path.getctime(os.path.join(self.screenshots_dir, x)), reverse=True)
            return [os.path.join(self.screenshots_dir, s) for s in screenshots[:4]]  # Last 4 screenshots
        except Exception as e:
            logger.error(f"Error getting screenshot gallery: {e}")
            return []
    
    def create_gif_from_screenshots(self):
        """Create a GIF from recent screenshots"""
        try:
            screenshots = [f for f in os.listdir(self.screenshots_dir) if f.endswith('.png')]
            screenshots.sort(key=lambda x: os.path.getctime(os.path.join(self.screenshots_dir, x)))
            
            if not screenshots:
                return "No screenshots available"
                
            gif_path = os.path.join(self.recordings_dir, f"history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.gif")
            
            # Create GIF
            images = []
            for screenshot in screenshots[-10:]:  # Last 10 screenshots
                img_path = os.path.join(self.screenshots_dir, screenshot)
                images.append(imageio.imread(img_path))
                
            imageio.mimsave(gif_path, images, duration=0.5)
            return f"Created GIF at {gif_path}"
        except Exception as e:
            logger.error(f"Error creating GIF: {e}")
            return f"Error creating GIF: {str(e)}"

    def create_interface(self) -> gr.Blocks:
        """Create a Gradio interface for browser task management and visualization"""
        
        # Create Gradio interface
        with gr.Blocks(title="Browser Automation Dashboard") as interface:
            gr.Markdown("## Browser Automation Dashboard")
            
            with gr.Row():
                with gr.Column():
                    gr.Markdown("### Live Browser View")
                    gr.HTML(f"""
                        <p>View live browser actions at: 
                            <a href="http://localhost:6080/vnc.html" target="_blank">
                                http://localhost:6080/vnc.html
                            </a>
                        </p>
                    """)
                
                with gr.Column():
                    gr.Markdown("### Recent Screenshots")
                    # Add a dummy textbox for triggering auto-refresh with auto-update configuration
                    dummy = gr.Textbox(value="dummy", visible=False, every=5)  # Auto-refresh every 5 seconds
                    gallery = gr.Gallery(
                        label="Screenshot History",
                        show_label=True,
                        columns=2,
                        rows=2,
                        height=400
                    )
                    
                    with gr.Row():
                        refresh_btn = gr.Button("Refresh Gallery")
                        create_gif_btn = gr.Button("Create GIF from History")
                    
                    gif_output = gr.Textbox(label="GIF Creation Status")
            
            # Set up event handlers
            refresh_btn.click(
                fn=self.get_screenshot_gallery,
                outputs=gallery
            )
            
            create_gif_btn.click(
                fn=self.create_gif_from_screenshots,
                outputs=gif_output
            )
            
            # Connect the dummy input to trigger gallery refresh
            dummy.change(
                fn=self.get_screenshot_gallery,
                inputs=[dummy],
                outputs=gallery
            )
        
        self.interface = interface
        return interface

def create_browser_interface(screenshots_dir: str, recordings_dir: str) -> gr.Blocks:
    """Create a Gradio interface for browser task management and visualization"""
    visualization = BrowserVisualization(screenshots_dir, recordings_dir)
    return visualization.create_interface()
