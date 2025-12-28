import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = new Resend(process.env.RESEND_API_KEY);

// To create an App Password: https://myaccount.google.com/apppasswords

const getDoctorTransporter = () => {
  const email = process.env.DOCTOR_EMAIL?.trim();
  const password = process.env.DOCTOR_EMAIL_PASSWORD?.trim();
  
  if (!email || !password) {
    console.warn('Doctor email credentials missing:', {
      hasEmail: !!email,
      hasPassword: !!password
    });
    return null;
  }
  

  const cleanPassword = password.replace(/\s+/g, '');
  
 
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: email,
      pass: cleanPassword, // Must be a Gmail App Password, not regular password
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
};

// Send confirmation to patient using Resend
export async function sendPatientConfirmation(patientEmail, appointmentDetails) {
  try {
    const clinicPhone = process.env.CLINIC_PHONE || '+91 94174-03743';
    const clinicAddress = process.env.CLINIC_ADDRESS || 'VPO Jangliana, Near Bham (Hoshiarpur)';
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || `Healthcare Clinic <${process.env.EMAIL_FROM}>`,
      to: [patientEmail],
      subject: 'Appointment Confirmation - Healthcare Clinic',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; }
                .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; }
                .appointment-id { background: #e3f2fd; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; }
                .highlight-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .important { color: #d63031; font-weight: bold; }
                .time-slot { background: white; padding: 12px; border-radius: 5px; border-left: 4px solid #4CAF50; margin: 15px 0; }
                .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Appointment Confirmed! 🎉</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>${appointmentDetails.patientName}</strong>,</p>
                    <p>Your appointment has been successfully booked with <strong>Dr. Manjit</strong>.</p>
                    
                    <div class="appointment-id">
                        Appointment ID: ${appointmentDetails.appointmentId}
                    </div>
                    
                    <div class="time-slot">
                        <h3>📅 Your Scheduled Appointment:</h3>
                        <p><strong>Date:</strong> ${new Date(appointmentDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Time:</strong> ${appointmentDetails.time}</p>
                        <p><strong>Duration:</strong> Approximately 15-20 minutes</p>
                    </div>
                    
                    <div class="details">
                        <h3>Appointment Details:</h3>
                        <p><strong>Patient Name:</strong> ${appointmentDetails.patientName}</p>
                        <p><strong>Problem:</strong> ${appointmentDetails.problem}</p>
                        <p><strong>Patient Phone:</strong> ${appointmentDetails.patientPhone}</p>
                        ${appointmentDetails.patientGender ? `<p><strong>Gender:</strong> ${appointmentDetails.patientGender}</p>` : ''}
                    </div>
                    
                    <div class="highlight-box">
                        <h3 class="important">⚠️ Important Timing Information:</h3>
                        <p><strong>Your appointment time is <u>${appointmentDetails.time}</u> on <u>${new Date(appointmentDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</u>.</strong></p>
                        <p class="important">Please arrive 15 minutes before your scheduled time.</p>
                        <p class="important">To change or reschedule your appointment timing, please contact us at:</p>
                        <p style="text-align: center; font-size: 18px; margin: 10px 0;">
                            <strong>📞 ${clinicPhone}</strong>
                        </p>
                        <p><em>Note: Please contact at least 24 hours in advance for any changes.</em></p>
                    </div>
                    
                    <h3>📋 Important Instructions:</h3>
                    <ul>
                        <li>✅ Please arrive <strong>15 minutes before</strong> your scheduled time</li>
                        <li>✅ Bring any previous medical reports if available</li>
                        <li>✅ Carry a valid ID proof and health insurance card (if any)</li>
                        <li>✅ Bring your current medications list</li>
                        <li>✅ Wear comfortable clothing for examination</li>
                    </ul>
                    
                    <div class="details">
                        <h3>📍 Clinic Address:</h3>
                        <p>${clinicAddress}</p>
                        <p><a href="https://maps.google.com/?q=${encodeURIComponent(clinicAddress)}" target="_blank">Click here for directions</a></p>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <p>Need to change your appointment?</p>
                        <p><strong>Call us at: ${clinicPhone}</strong></p>
                    </div>
                </div>
                <div class="footer">
                    <p>Best regards,<br><strong>Manjit Healthcare</strong></p>
                    <p>📞 Phone: ${clinicPhone}</p>
                    <p>📍 Address: ${clinicAddress}</p>
                    <p>⏰ Clinic Hours: ${process.env.CLINIC_HOURS || 'Monday to Saturday: 9:00 AM - 6:00 PM'}</p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending patient email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendPatientConfirmation:', error);
    return { success: false, error };
  }
}

// Send notification to doctor using nodemailer
export async function sendDoctorNotification(appointmentDetails) {
  try {
    const doctorTransporter = getDoctorTransporter();
    
    // If credentials are not configured, skip sending but don't fail
    if (!doctorTransporter) {
      console.warn('Doctor email credentials not configured. Skipping doctor notification.');
      return { success: false, error: 'Doctor email credentials not configured' };
    }
    
    const doctorEmail = process.env.DOCTOR_EMAIL?.trim();
    if (!doctorEmail) {
      console.warn('DOCTOR_EMAIL not configured. Skipping doctor notification.');
      return { success: false, error: 'DOCTOR_EMAIL not configured' };
    }
    
    const doctorPortalLink = 'https://www.manjithealthcare.com/doctor';
    
    const mailOptions = {
      from: `"Healthcare Clinic" <${doctorEmail}>`,
      to: doctorEmail,
      subject: `New Appointment Booking - ${appointmentDetails.appointmentId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; }
                .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .urgent { background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336; margin: 20px 0; }
                .action-box { background: #e3f2fd; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
                .cta-button { display: inline-block; background: #2196F3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; }
                .time-box { background: #fff3cd; padding: 15px; border-radius: 5px; border: 2px solid #ffc107; margin: 15px 0; }
                .footer-note { background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px; color: #666; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Appointment Booked 🔔</h1>
                    <p>Appointment ID: ${appointmentDetails.appointmentId}</p>
                </div>
                <div class="content">
                    <div class="time-box">
                        <h3>⏰ Scheduled Appointment Time:</h3>
                        <p><strong>Date:</strong> ${new Date(appointmentDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Time:</strong> ${appointmentDetails.time}</p>
                        <p><strong>Booked on:</strong> ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
                    </div>
                    
                    <div class="details">
                        <h3>👤 Patient Information:</h3>
                        <p><strong>Name:</strong> ${appointmentDetails.patientName}</p>
                        <p><strong>Email:</strong> ${appointmentDetails.patientEmail}</p>
                        <p><strong>Phone:</strong> ${appointmentDetails.patientPhone}</p>
                        ${appointmentDetails.patientGender ? `<p><strong>Gender:</strong> ${appointmentDetails.patientGender}</p>` : ''}
                        ${appointmentDetails.patientAge ? `<p><strong>Age:</strong> ${appointmentDetails.patientAge}</p>` : ''}
                    </div>
                    
                    <div class="details">
                        <h3>📋 Medical Information:</h3>
                        <p><strong>Primary Problem:</strong> ${appointmentDetails.problem}</p>
                        ${appointmentDetails.symptoms ? `<p><strong>Symptoms:</strong> ${appointmentDetails.symptoms}</p>` : ''}
                        ${appointmentDetails.medicalHistory ? `<p><strong>Medical History:</strong> ${appointmentDetails.medicalHistory}</p>` : ''}
                    </div>
                    
                    ${appointmentDetails.address ? `
                    <div class="details">
                        <h3>📍 Patient Address:</h3>
                        <p>${appointmentDetails.address}</p>
                    </div>
                    ` : ''}
                    
                    <div class="action-box">
                        <h3>📝 Confirm or Manage Appointment</h3>
                        <p>Click the button below to confirm this appointment and manage your schedule:</p>
                        <a href="${doctorPortalLink}" class="cta-button">🔗 Open Doctor Portal</a>
                        <p style="margin-top: 10px; font-size: 14px;">
                            Or copy this link: <br>
                            <code style="background: white; padding: 5px; border-radius: 3px;">${doctorPortalLink}</code>
                        </p>
                    </div>
                    
                    <div class="urgent">
                        <h3>⚡ Action Required:</h3>
                        <p><strong>1. Confirm Appointment:</strong> Please confirm this appointment in the doctor portal</p>
                        <p><strong>2. Prepare Notes:</strong> Review patient information before the appointment</p>
                        <p><strong>3. Set Reminder:</strong> Add to your calendar for ${new Date(appointmentDetails.date).toLocaleDateString('en-IN')} at ${appointmentDetails.time}</p>
                    </div>
                    
                    <div class="footer-note">
                        <p><strong>Note:</strong> This is an automated notification. Please do not reply to this email.</p>
                        <p>Use the Doctor Portal link above to manage appointments.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
      // Add text version for email clients that don't support HTML
      text: `
NEW APPOINTMENT BOOKING
=======================

Appointment ID: ${appointmentDetails.appointmentId}

Patient: ${appointmentDetails.patientName}
Email: ${appointmentDetails.patientEmail}
Phone: ${appointmentDetails.patientPhone}

Appointment Date: ${new Date(appointmentDetails.date).toLocaleDateString('en-IN')}
Appointment Time: ${appointmentDetails.time}

Problem: ${appointmentDetails.problem}

To confirm this appointment, please visit:
${doctorPortalLink}

This is an automated notification. Please do not reply to this email.
      `
    };

    const result = await doctorTransporter.sendMail(mailOptions);
    return { success: true, data: result };
  } catch (error) {
    // Provide helpful error message for Gmail authentication issues
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      const email = process.env.DOCTOR_EMAIL?.trim();
      const passwordLength = process.env.DOCTOR_EMAIL_PASSWORD?.trim().replace(/\s+/g, '').length;
      
      console.error('❌ Gmail authentication failed!');
      console.error('Email:', email || 'NOT SET');
      console.error('Password length:', passwordLength || 'NOT SET', '(should be 16 characters)');
      console.error('');
      console.error('Please check:');
      console.error('1. ✅ You are using a Gmail App Password (not your regular password)');
      console.error('2. ✅ 2-Step Verification is enabled on your Google account');
      console.error('3. ✅ App Password has exactly 16 characters (no spaces)');
      console.error('4. ✅ Environment variables are set in .env.local file');
      console.error('5. ✅ Server was restarted after adding environment variables');
      console.error('');
      console.error('To create an App Password: https://myaccount.google.com/apppasswords');
      console.error('');
      console.error('Your .env.local should look like:');
      console.error('DOCTOR_EMAIL=your-email@gmail.com');
      console.error('DOCTOR_EMAIL_PASSWORD=abcdefghijklmnop  (16 characters, no spaces)');
    } else {
      console.error('Error sending doctor notification:', error);
    }
    // Return failure but don't throw - appointment was created successfully
    return { success: false, error: error.message || 'Failed to send email' };
  }
}