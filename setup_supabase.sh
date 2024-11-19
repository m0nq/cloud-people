#!/bin/bash

# Check for Homebrew and install if not present
if ! command -v brew &> /dev/null; then
  echo "Homebrew not found. Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Docker not found. Installing Docker..."
  brew install --cask docker
  open /Applications/Docker.app
  echo "Please wait for Docker to start before continuing."
  read -rp "Press Enter once Docker is running..."
fi

# Install Supabase CLI via Homebrew
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI not found. Installing Supabase CLI..."
  brew install supabase/tap/supabase
fi

# Initialize a new Supabase project
echo "Initializing Supabase project..."
supabase init

# Start Supabase services locally
echo "Starting Supabase services..."
supabase start

echo "Supabase setup complete. Access Supabase Studio at http://localhost:54323"
