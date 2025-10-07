#!/usr/bin/env node
/**
 * Script to create and configure TwelveLabs index for PropSage
 * Run with: node scripts/setup-tl-index.js
 */

import { config } from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load environment
config();

const TL_API_KEY = process.env.TL_API_KEY || process.env.TWELVELABS_API_KEY;
const TL_BASE_URL = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.2';

if (!TL_API_KEY) {
  console.error('❌ TL_API_KEY not found in environment');
  process.exit(1);
}

async function createIndex() {
  console.log('🚀 Creating TwelveLabs index for PropSage...');
  
  const indexConfig = {
    index_name: 'propsage-cfb-2025',
    engines: [
      {
        engine_name: 'marengo2.6',
        engine_options: ['visual', 'conversation', 'text_in_video']
      }
    ],
    addons: ['thumbnail'] // Enable thumbnail generation
  };
  
  try {
    const response = await fetch(`${TL_BASE_URL}/indexes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TL_API_KEY
      },
      body: JSON.stringify(indexConfig)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create index: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Index created successfully!');
    console.log('📋 Index Details:');
    console.log(`   ID: ${result._id}`);
    console.log(`   Name: ${result.index_name}`);
    console.log(`   Engines: ${result.engines.map(e => e.engine_name).join(', ')}`);
    
    console.log('\n🔧 Add this to your .env file:');
    console.log(`TWELVELABS_INDEX_ID=${result._id}`);
    
    return result._id;
    
  } catch (error) {
    console.error('❌ Failed to create index:', error.message);
    process.exit(1);
  }
}

async function listExistingIndexes() {
  console.log('📋 Checking existing indexes...');
  
  try {
    const response = await fetch(`${TL_BASE_URL}/indexes?page_limit=20`, {
      headers: { 'x-api-key': TL_API_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list indexes: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.data && result.data.length > 0) {
      console.log('🗂️  Found existing indexes:');
      result.data.forEach((index, i) => {
        console.log(`   ${i + 1}. ${index.index_name} (${index._id}) - ${index.index_options?.index_type || 'unknown'}`);
      });
      
      // Check if we already have a propsage index
      const existing = result.data.find(idx => 
        idx.index_name.includes('propsage') || 
        idx.index_name.includes('cfb')
      );
      
      if (existing) {
        console.log(`\n♻️  Found existing PropSage-related index: ${existing.index_name}`);
        console.log('🔧 Add this to your .env file:');
        console.log(`TWELVELABS_INDEX_ID=${existing._id}`);
        return existing._id;
      }
    } else {
      console.log('📭 No existing indexes found.');
    }
    
    return null;
    
  } catch (error) {
    console.error('⚠️  Could not list indexes:', error.message);
    return null;
  }
}

async function main() {
  console.log('🏈 PropSage TwelveLabs Setup\n');
  
  // Check for existing indexes first
  const existingIndexId = await listExistingIndexes();
  
  if (existingIndexId) {
    console.log('\n✅ Using existing index. Setup complete!');
    return;
  }
  
  // Create new index
  console.log('\n🆕 Creating new index...');
  await createIndex();
  
  console.log('\n🎯 Next steps:');
  console.log('1. Update your .env file with the TWELVELABS_INDEX_ID');
  console.log('2. Run the video indexing script to add your clips');
  console.log('3. Test the search functionality');
}

main().catch(console.error);