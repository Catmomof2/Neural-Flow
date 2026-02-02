
/**
 * In a real-world scenario, this would call a backend API 
 * that uses SendGrid, AWS SES, or similar services.
 * For this implementation, we simulate the logic.
 */

export const sendNotification = async (type: 'CONFIRMATION' | 'OWNER_ALERT', data: any) => {
  console.group(`📧 Email Notification: ${type}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload:', data);
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (type === 'CONFIRMATION') {
    console.log(`To: ${data.email}`);
    console.log('Subject: Welcome to NeuralFlow AI Waitlist!');
    console.log('Body: Your spot is reserved. Share your link to move up the queue.');
  } else if (type === 'OWNER_ALERT') {
    console.log('To: admin@neuralflow.ai');
    console.log('Subject: New Contact Submission');
    console.log(`Body: ${data.email} sent a message: ${data.message}`);
  }
  
  console.groupEnd();
  return { success: true };
};
