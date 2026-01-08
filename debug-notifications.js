/**
 * Run this script in your browser's Developer Console (F12)
 * to debug and test notification navigation
 */

// Step 1: Clear old notifications
console.log('=== Step 1: Clearing old notifications ===');
localStorage.removeItem('dogepump_notifications');

// Step 2: Check current wallet address
const currentAddress = localStorage.getItem('dogepump_address');
const adminWallet = '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a';

console.log('Current wallet address:', currentAddress);
console.log('Admin wallet address:', adminWallet);
console.log('Is admin?', currentAddress && currentAddress.toLowerCase() === adminWallet.toLowerCase());

// Step 3: Check current notifications
const currentNotifications = JSON.parse(localStorage.getItem('dogepump_notifications') || '[]');
console.log('Current notifications in localStorage:', currentNotifications);

// Step 4: Create a test notification (for testing only)
if (currentAddress && currentAddress.toLowerCase() === adminWallet.toLowerCase()) {
  console.log('=== Creating test notification ===');
  const testNotification = {
    id: Date.now().toString(),
    type: 'success',
    title: 'Test Admin Notification',
    message: 'This should navigate to admin dashboard',
    timestamp: Date.now(),
    read: false,
    link: '/admin#token-reports'
  };
  const updatedNotifications = [testNotification, ...currentNotifications];
  localStorage.setItem('dogepump_notifications', JSON.stringify(updatedNotifications));
  console.log('Test notification created. Please refresh the page and click on it.');
  console.log('Expected: Should navigate to /admin#token-reports');
} else {
  console.log('⚠️ Not connected as admin wallet. Please connect the admin wallet first.');
  console.log('Admin wallet:', adminWallet);
}

console.log('\n=== Next Steps ===');
console.log('1. Refresh the page (Cmd+R or F5)');
console.log('2. Click the wallet menu notification bell');
console.log('3. Click on any notification');
console.log('4. Check console for navigation logs');
console.log('\nExpected console output when clicking:');
console.log('[Notification Click] Notification: {...}');
console.log('[Notification Click] Link: /admin#token-reports');
console.log('[Notification Click] Navigating to: /admin#token-reports');
