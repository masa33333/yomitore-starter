// Test script to clear sessionStorage for bookmark testing
// Run this in browser console before testing bookmark resume

console.log('🔧 Clearing sessionStorage bookmark flags for testing...');

// Clear all bookmark-related sessionStorage
sessionStorage.removeItem('bookmark_resumed');

console.log('✅ SessionStorage cleared');
console.log('📋 Current sessionStorage:', {
  bookmark_resumed: sessionStorage.getItem('bookmark_resumed'),
  keys: Object.keys(sessionStorage)
});

console.log('🧪 Ready for bookmark resume testing');