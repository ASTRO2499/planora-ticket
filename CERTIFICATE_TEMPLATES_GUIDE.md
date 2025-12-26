# Certificate Template Customization Guide

## Overview
The certificate template system allows event organizers to create fully customized certificates with their own branding, colors, borders, signatures, and text. Certificates are automatically generated after events and given to attendees who checked in.

## Features

### Customization Options

1. **Branding Colors**
   - `brandPrimary`: Main certificate color (borders, title, name)
   - `brandAccent`: Accent color (decorative elements, lines)
   - `brandDark`: Dark text color

2. **Border Styles**
   - `double`: Double-line border (professional)
   - `single`: Single-line border (clean)
   - `decorative`: Border with corner dots (elegant)
   - `none`: No border (minimal)

3. **Logo/Header**
   - `showLogo`: Show header logo text (true/false)
   - `logoText`: Custom header text (e.g., "TECH CERTIFICATE", "PLANORA")

4. **Signature**
   - `signatureName`: Name for signature line
   - `signatureTitle`: Title below signature (e.g., "Event Organizer", "CEO")

5. **Custom Text**
   - `customText`: Replace default "for successfully participating in" with your text

6. **Layout** (advanced)
   - `layout`: 'modern', 'classic', 'elegant', or 'minimal'

## How to Use

### Method 1: Via Organizer Dashboard (Recommended)

1. **Login to Organizer Dashboard**
   - Go to `/organizer`
   - Login with your organizer credentials or secret

2. **Select Your Event**
   - Choose your event from the dropdown

3. **Scroll to Certificate Template Section**
   - You'll see a gold/amber colored box titled "Certificate Template (Custom Design)"

4. **Choose a Preset** (quickest way)
   - Click one of the preset buttons:
     - **Modern**: Purple/pink professional design
     - **Classic**: Navy elegant design with decorative borders
     - **Corporate**: Blue professional design
     - **Golden**: Gold prestige design

5. **Customize Template**
   - Edit the JSON directly in the textarea
   - Click "Preview" to see color swatches and settings
   - Adjust colors, text, signature as needed

6. **Save Template**
   - Click "Save Certificate Template"
   - Your template is now saved for this event

7. **Generate Certificates**
   - After event completes and attendees check in
   - Click "Generate Certificates" in the green "Event Certificates" section
   - All certificates will use your custom template!

### Method 2: Using the Generator Script (Interactive)

1. **Run the Script**
   ```bash
   node scripts/certificate_template_generator.js YOUR_EVENT_ID YOUR_ORGANIZER_SECRET
   ```

2. **Choose Method**
   - Option 1: Use a preset template (6 professional presets available)
   - Option 2: Create custom template (step-by-step interactive)

3. **Follow Prompts**
   - Answer questions about colors, borders, logo, signature
   - Preview your choices before uploading
   - Confirm and upload

4. **Benefits**
   - More guided than manual JSON editing
   - Built-in validation
   - Easy preset selection
   - Can customize signature interactively

## Template Examples

### Example 1: Modern Tech Certificate
```json
{
  "brandPrimary": "#7C3AED",
  "brandAccent": "#EC4899",
  "brandDark": "#1F2937",
  "borderStyle": "double",
  "showLogo": true,
  "logoText": "PLANORA",
  "signatureName": "Alex Johnson",
  "signatureTitle": "Event Organizer",
  "customText": "for successfully participating in"
}
```

### Example 2: Corporate Professional
```json
{
  "brandPrimary": "#1E40AF",
  "brandAccent": "#3B82F6",
  "brandDark": "#1E3A8A",
  "borderStyle": "single",
  "showLogo": true,
  "logoText": "PROFESSIONAL CERTIFICATE",
  "signatureName": "Dr. Sarah Williams",
  "signatureTitle": "CEO, TechCorp",
  "customText": "awarded for exceptional participation in"
}
```

### Example 3: Minimal Clean
```json
{
  "brandPrimary": "#334155",
  "brandAccent": "#64748B",
  "brandDark": "#0F172A",
  "borderStyle": "none",
  "showLogo": false,
  "logoText": "",
  "signatureName": "",
  "signatureTitle": "",
  "customText": "presented to recognize participation in"
}
```

### Example 4: Golden Prestige
```json
{
  "brandPrimary": "#D97706",
  "brandAccent": "#F59E0B",
  "brandDark": "#78350F",
  "borderStyle": "decorative",
  "showLogo": true,
  "logoText": "CERTIFICATE OF EXCELLENCE",
  "signatureName": "Michael Chen",
  "signatureTitle": "Conference Director",
  "customText": "presented in honor of distinguished participation in"
}
```

## Color Palette Suggestions

### Professional Blue
```
Primary: #1E40AF (Blue 700)
Accent: #3B82F6 (Blue 500)
Dark: #1E3A8A (Blue 900)
```

### Tech Green
```
Primary: #059669 (Emerald 600)
Accent: #10B981 (Emerald 500)
Dark: #065F46 (Emerald 800)
```

### Creative Purple
```
Primary: #7C3AED (Violet 600)
Accent: #EC4899 (Pink 500)
Dark: #5B21B6 (Violet 800)
```

### Academic Navy
```
Primary: #0F172A (Slate 900)
Accent: #94A3B8 (Slate 400)
Dark: #1E293B (Slate 800)
```

### Luxury Gold
```
Primary: #D97706 (Amber 600)
Accent: #F59E0B (Amber 500)
Dark: #78350F (Amber 900)
```

## Workflow

1. **Before Event**
   - Create event in organizer dashboard
   - Design certificate template (via dashboard or script)
   - Save template
   - Test by generating a certificate for a test attendee

2. **During Event**
   - Attendees check in via QR code scanning
   - System marks tickets as `used = true`

3. **After Event**
   - Go to organizer dashboard
   - Click "Generate Certificates"
   - System creates certificates for all checked-in attendees
   - Certificates use your custom template

4. **Attendee Access**
   - Attendees visit My Tickets page
   - See green "Download Certificate" button
   - Download personalized certificate PDF with your branding

## Advanced Tips

### Signature Lines
- Keep signature names short (under 30 characters)
- Title should be concise (under 40 characters)
- Examples: "Event Director", "CEO", "President", "Organizer"

### Custom Text
- Keep it concise (under 80 characters)
- Should flow naturally: "This certificate is proudly presented to [NAME] **[YOUR TEXT]** [EVENT NAME]"
- Examples:
  - "for successfully participating in"
  - "in recognition of outstanding performance in"
  - "awarded for exceptional contribution to"
  - "presented in honor of participation in"

### Logo Text
- Short and impactful (2-4 words)
- All caps looks more professional
- Examples: "PLANORA", "TECH SUMMIT", "INNOVATION AWARDS", "CERTIFICATE OF ACHIEVEMENT"

### Border Selection
- **Double**: Best for formal events, conferences
- **Single**: Clean, modern events
- **Decorative**: Awards ceremonies, special achievements
- **None**: Minimalist events, tech conferences

## Troubleshooting

### Certificate Template Not Applying
**Problem**: Generated certificates don't use custom template
**Solution**: 
- Verify template was saved (check for success toast)
- Re-generate certificates after saving template
- Check JSON syntax is valid

### Invalid JSON Error
**Problem**: "Invalid JSON" when trying to save
**Solution**:
- Use JSON validator (jsonlint.com)
- Check for missing commas, quotes, brackets
- Copy a working example and modify

### Colors Not Showing Correctly
**Problem**: Certificate colors don't match preview
**Solution**:
- Use hex format with # (e.g., #7C3AED not 7C3AED)
- Use 6-character hex codes (not 3-character)
- Preview in dashboard before saving

### Signature Not Appearing
**Problem**: Signature line doesn't show on certificate
**Solution**:
- Ensure `signatureName` is not empty string
- Both signatureName and signatureTitle must be strings
- Re-generate certificates after adding signature

## API Reference

### Get Certificate Template
```
GET /api/organizer/certificate-template?eventId={eventId}
Headers: x-organizer-secret or Authorization: Bearer {token}
```

### Save Certificate Template
```
POST /api/organizer/certificate-template?eventId={eventId}
Headers: 
  x-organizer-secret or Authorization: Bearer {token}
  Content-Type: application/json
Body: {template JSON}
```

## Storage Location

Certificate templates are stored in Supabase Storage:
- Bucket: `ticket-templates`
- Path: `certificate-templates/{eventId}.json`

## Template Inheritance

If no certificate template is found, the system will:
1. Check for certificate-specific template
2. Fall back to ticket template (if colors defined)
3. Fall back to default colors (purple/pink)

## Best Practices

1. **Test Early**: Create template before event, test with dummy attendee
2. **Keep It Simple**: Don't overcomplicate - less is more
3. **Brand Consistency**: Match your event branding
4. **Professional Fonts**: System uses Helvetica (clean, professional)
5. **Readable Colors**: Ensure sufficient contrast
6. **Preview First**: Always preview before mass generation
7. **Backup Template**: Save your JSON somewhere safe for reuse

## Examples by Event Type

### Tech Conference
- Colors: Blue/Cyan
- Border: Single or None
- Logo: "TECH SUMMIT 2025"
- Text: "for successfully completing"

### Academic Workshop
- Colors: Navy/Gray
- Border: Decorative
- Logo: "CERTIFICATE OF COMPLETION"
- Text: "in recognition of participation in"
- Signature: Professor name + title

### Corporate Training
- Colors: Corporate blue
- Border: Double
- Logo: Company name
- Text: "awarded for exceptional performance in"
- Signature: CEO + title

### Creative Awards
- Colors: Purple/Pink or Gold
- Border: Decorative
- Logo: "INNOVATION AWARD"
- Text: "presented in honor of outstanding contribution to"
- Signature: Judge or organizer

### Hackathon
- Colors: Green/Cyan
- Border: None
- Logo: Event name
- Text: "for participating in"
- Signature: Optional

## Support

For issues:
- Check JSON syntax
- Verify Supabase permissions
- Review browser console for errors
- Contact support with event ID

## Future Enhancements

Potential future features:
- Upload custom logo images
- Multiple signature lines
- Custom fonts
- Certificate background images
- QR code on certificate
- Batch template application across events
