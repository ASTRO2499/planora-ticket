/**
 * Certificate Template Generator Script
 * 
 * Usage: node scripts/certificate_template_generator.js <EVENT_ID> <ORGANIZER_SECRET>
 * 
 * This script helps you create and upload custom certificate templates for your events.
 * You can customize colors, borders, signatures, and more!
 */

const http = require('http');
const https = require('https');
const readline = require('readline');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EVENT_ID = process.argv[2];
const ORGANIZER_SECRET = process.argv[3];

if (!EVENT_ID || !ORGANIZER_SECRET) {
  console.error('❌ Usage: node scripts/certificate_template_generator.js <EVENT_ID> <ORGANIZER_SECRET>');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const urlOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-organizer-secret': ORGANIZER_SECRET,
        ...options.headers
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, urlOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

const PRESET_TEMPLATES = {
  '1': {
    name: 'Modern Professional',
    template: {
      brandPrimary: '#7C3AED',
      brandAccent: '#EC4899',
      brandDark: '#1F2937',
      layout: 'modern',
      borderStyle: 'double',
      showLogo: true,
      logoText: 'PLANORA',
      signatureName: '',
      signatureTitle: '',
      customText: 'for successfully participating in'
    }
  },
  '2': {
    name: 'Classic Elegant',
    template: {
      brandPrimary: '#0F172A',
      brandAccent: '#94A3B8',
      brandDark: '#1E293B',
      layout: 'classic',
      borderStyle: 'decorative',
      showLogo: true,
      logoText: 'CERTIFICATE OF ACHIEVEMENT',
      signatureName: '',
      signatureTitle: '',
      customText: 'in recognition of outstanding participation in'
    }
  },
  '3': {
    name: 'Corporate Blue',
    template: {
      brandPrimary: '#1E40AF',
      brandAccent: '#3B82F6',
      brandDark: '#1E3A8A',
      layout: 'modern',
      borderStyle: 'single',
      showLogo: true,
      logoText: 'PROFESSIONAL CERTIFICATE',
      signatureName: '',
      signatureTitle: '',
      customText: 'awarded for exceptional participation in'
    }
  },
  '4': {
    name: 'Minimal Clean',
    template: {
      brandPrimary: '#334155',
      brandAccent: '#64748B',
      brandDark: '#0F172A',
      layout: 'minimal',
      borderStyle: 'none',
      showLogo: false,
      logoText: '',
      signatureName: '',
      signatureTitle: '',
      customText: 'presented to recognize participation in'
    }
  },
  '5': {
    name: 'Golden Prestige',
    template: {
      brandPrimary: '#D97706',
      brandAccent: '#F59E0B',
      brandDark: '#78350F',
      layout: 'elegant',
      borderStyle: 'decorative',
      showLogo: true,
      logoText: 'CERTIFICATE OF EXCELLENCE',
      signatureName: '',
      signatureTitle: '',
      customText: 'presented in honor of distinguished participation in'
    }
  },
  '6': {
    name: 'Tech Green',
    template: {
      brandPrimary: '#059669',
      brandAccent: '#10B981',
      brandDark: '#065F46',
      layout: 'modern',
      borderStyle: 'double',
      showLogo: true,
      logoText: 'TECH CERTIFICATE',
      signatureName: '',
      signatureTitle: '',
      customText: 'awarded for successful completion of'
    }
  }
};

async function main() {
  console.log('\n🎓 Certificate Template Generator\n');
  console.log(`Event ID: ${EVENT_ID}\n`);

  // Check existing template
  console.log('📥 Checking for existing template...\n');
  const existingRes = await makeRequest(`/api/organizer/certificate-template?eventId=${EVENT_ID}`);
  
  if (existingRes.status === 200 && existingRes.data.template) {
    console.log('✅ Found existing template:');
    console.log(JSON.stringify(existingRes.data.template, null, 2));
    console.log('\n');
    const overwrite = await question('Do you want to overwrite it? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
      console.log('❌ Cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Choose template creation method:\n');
  console.log('1. Use a preset template');
  console.log('2. Create custom template (interactive)\n');

  const choice = await question('Enter choice (1 or 2): ');

  let template;

  if (choice === '1') {
    // Show presets
    console.log('\n🎨 Available Preset Templates:\n');
    Object.entries(PRESET_TEMPLATES).forEach(([key, preset]) => {
      console.log(`${key}. ${preset.name}`);
    });
    console.log('\n');

    const presetChoice = await question('Select preset (1-6): ');
    const preset = PRESET_TEMPLATES[presetChoice];

    if (!preset) {
      console.log('❌ Invalid choice.');
      rl.close();
      return;
    }

    template = { ...preset.template };
    console.log(`\n✅ Selected: ${preset.name}\n`);

    // Optional customization
    const customize = await question('Do you want to customize signature? (yes/no): ');
    if (customize.toLowerCase() === 'yes' || customize.toLowerCase() === 'y') {
      const sigName = await question('Signature name (leave empty to skip): ');
      if (sigName.trim()) {
        template.signatureName = sigName.trim();
        const sigTitle = await question('Signature title (e.g., "Event Organizer"): ');
        template.signatureTitle = sigTitle.trim();
      }
    }

  } else if (choice === '2') {
    // Custom interactive template
    console.log('\n🎨 Custom Template Configuration\n');

    const brandPrimary = await question('Primary brand color (hex, e.g., #7C3AED): ');
    const brandAccent = await question('Accent color (hex, e.g., #EC4899): ');
    const brandDark = await question('Dark color (hex, e.g., #1F2937): ');
    
    console.log('\nBorder Style:');
    console.log('1. Double border');
    console.log('2. Single border');
    console.log('3. Decorative (with corner dots)');
    console.log('4. None\n');
    const borderChoice = await question('Choose (1-4): ');
    const borderMap = { '1': 'double', '2': 'single', '3': 'decorative', '4': 'none' };
    const borderStyle = borderMap[borderChoice] || 'double';

    const showLogo = await question('Show logo/header text? (yes/no): ');
    let logoText = '';
    if (showLogo.toLowerCase() === 'yes' || showLogo.toLowerCase() === 'y') {
      logoText = await question('Logo text (e.g., "PLANORA"): ');
    }

    const customText = await question('Custom achievement text (e.g., "for successfully participating in"): ');
    
    const addSignature = await question('Add signature? (yes/no): ');
    let signatureName = '';
    let signatureTitle = '';
    if (addSignature.toLowerCase() === 'yes' || addSignature.toLowerCase() === 'y') {
      signatureName = await question('Signature name: ');
      signatureTitle = await question('Signature title: ');
    }

    template = {
      brandPrimary: brandPrimary.trim() || '#7C3AED',
      brandAccent: brandAccent.trim() || '#EC4899',
      brandDark: brandDark.trim() || '#1F2937',
      layout: 'modern',
      borderStyle,
      showLogo: showLogo.toLowerCase() === 'yes' || showLogo.toLowerCase() === 'y',
      logoText: logoText.trim(),
      signatureName: signatureName.trim(),
      signatureTitle: signatureTitle.trim(),
      customText: customText.trim() || 'for successfully participating in'
    };

  } else {
    console.log('❌ Invalid choice.');
    rl.close();
    return;
  }

  // Show preview
  console.log('\n📄 Template Preview:\n');
  console.log(JSON.stringify(template, null, 2));
  console.log('\n');

  const confirm = await question('Upload this template? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled.');
    rl.close();
    return;
  }

  // Upload template
  console.log('\n📤 Uploading template...\n');
  const uploadRes = await makeRequest('/api/organizer/certificate-template?eventId=' + EVENT_ID, {
    method: 'POST',
    body: template
  });

  if (uploadRes.status === 200) {
    console.log('✅ Template uploaded successfully!\n');
    console.log('🎓 Next steps:');
    console.log('1. Generate certificates for your event attendees');
    console.log('2. Attendees will receive certificates with your custom design');
    console.log('3. Test certificate generation from organizer dashboard\n');
  } else {
    console.log('❌ Upload failed:', uploadRes.data);
  }

  rl.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  rl.close();
  process.exit(1);
});
