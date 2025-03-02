from setuptools import setup, find_packages

setup(
    name="browser_use",
    version="0.1.40",  # Updated to match current version
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.115.8",
        "uvicorn>=0.34.0",
        "python-dotenv>=1.0.1",
        "httpx>=0.27.2",
        "langchain-google-genai>=0.0.11",  # Updated to latest version
        "playwright>=1.49.0",
        "openai>=1.10.0",
        "anthropic>=0.8.0",
        "pydantic>=2.10.4",
        "websockets>=11.0.0",
        "python-multipart>=0.0.18",  # Required by gradio
        "gradio>=5.10.0",
        "pillow>=9.3.0",  # For image processing
        "imageio>=2.31.1",  # For GIF creation
        "pyperclip>=1.9.0",
        "langchain-mistralai>=0.2.4",
        "json-repair>=0.2.0"
    ],
)
