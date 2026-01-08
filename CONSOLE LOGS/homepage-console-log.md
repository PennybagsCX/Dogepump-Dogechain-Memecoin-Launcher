inpage.js:1 MetaMask encountered an error setting the global Ethereum provider - this is likely due to another Ethereum wallet extension also setting the global Ethereum provider: TypeError: Cannot set property ethereum of #<Window> which has only a getter
    at a (inpage.js:1:146243)
    at r.initializeProvider (inpage.js:1:146014)
    at Object.<anonymous> (inpage.js:1:2308)
    at Object.<anonymous> (inpage.js:1:6316)
    at 2.../../shared/modules/provider-injection (inpage.js:1:6329)
    at i (inpage.js:1:254)
    at e (inpage.js:1:412)
    at inpage.js:1:429
a @ inpage.js:1
r.initializeProvider @ inpage.js:1
(anonymous) @ inpage.js:1
(anonymous) @ inpage.js:1
2.../../shared/modules/provider-injection @ inpage.js:1
i @ inpage.js:1
e @ inpage.js:1
(anonymous) @ inpage.js:1
(index):71 [PriceHistory] Loaded 1000 entries from storage
(index):71 [LaunchCycler] Loaded 21 shown launch events from storage
(index):71 [MIGRATION] Migrated 24 tokens with delisted fields
(index):71 [MIGRATION] Migrated 24 tokens with delisted fields
(index):71 [StoreContext] Loaded notifications from localStorage: []
(index):71 [StoreContext] Loaded notifications from localStorage: []
content_script.js:4080 🚀 Initializing Moat Chrome Extension...
content_script.js:4083 🔧 Moat: Initializing project connection...
content_script.js:90 🔧 Moat: Initializing TaskStore and MarkdownGenerator utilities...
content_script.js:91 🔧 Moat: window.MoatTaskStore available: true
content_script.js:92 🔧 Moat: window.MoatMarkdownGenerator available: true
content_script.js:93 🔧 Moat: window.directoryHandle available: false
content_script.js:105 ⚠️ Moat: TaskStore created but not initialized (no directory handle)
content_script.js:108 🔧 Moat: TaskStore instance: TaskStore {tasks: Array(0), directoryHandle: null}
content_script.js:122 ✅ Moat: MarkdownGenerator initialized successfully
content_script.js:123 🔧 Moat: MarkdownGenerator functions: (8) ['generateMarkdownFromTasks', 'rebuildMarkdownFromJson', 'rebuildMarkdownFile', 'writeMarkdownToFile', 'generateTaskStats', 'statusToCheckbox', 'truncateComment', 'sortTasksByTimestamp']
content_script.js:133 🔧 Moat: Exposing initialized instances to global window...
content_script.js:136 🔧 Moat: Global exposure complete - window.taskStore: true
content_script.js:137 🔧 Moat: Global exposure complete - window.markdownGenerator: true
content_script.js:4125 Moat Chrome Extension loaded (AG-UI disabled)
content_script.js:4090 ⚠️ Falling back to legacy system
content_script.js:621 🚀 Moat: Initializing project with persistence system...
moat.js:286 🔧 ConnectionManager: Initialized
moat.js:3404 Moat: Setting up event listeners...
moat.js:3791 Moat: Initializing, document.readyState: interactive
moat.js:3801 Moat: Document already loaded, initializing moat immediately...
(index):71 [Layout] Notifications updated: []
(index):71 [Layout] Notifications with links: []
(index):71 [Layout] Notifications without links: []
(index):65 [PoolService] Pool not deployed yet - set POOL_ADDRESS in poolPriceService.ts
warn @ (index):65
initialize @ poolPriceService.ts:84
getDCPriceFromPool @ poolPriceService.ts:256
getPriceFromPool @ priceOracleService.ts:132
getDCPriceUSD @ priceOracleService.ts:78
initializePriceOracle @ StoreContext.tsx:719
(anonymous) @ StoreContext.tsx:738
react_stack_bottom_frame @ react-dom_client.js?v=f46fcb8a:18567
runWithFiberInDEV @ react-dom_client.js?v=f46fcb8a:997
commitHookEffectListMount @ react-dom_client.js?v=f46fcb8a:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=f46fcb8a:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11055
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11055
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=f46fcb8a:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=f46fcb8a:11066
flushPassiveEffects @ react-dom_client.js?v=f46fcb8a:13150
(anonymous) @ react-dom_client.js?v=f46fcb8a:12776
performWorkUntilDeadline @ react-dom_client.js?v=f46fcb8a:36
<StoreProvider>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=f46fcb8a:247
App @ App.tsx:94
react_stack_bottom_frame @ react-dom_client.js?v=f46fcb8a:18509
renderWithHooksAgain @ react-dom_client.js?v=f46fcb8a:5729
renderWithHooks @ react-dom_client.js?v=f46fcb8a:5665
updateFunctionComponent @ react-dom_client.js?v=f46fcb8a:7475
beginWork @ react-dom_client.js?v=f46fcb8a:8525
runWithFiberInDEV @ react-dom_client.js?v=f46fcb8a:997
performUnitOfWork @ react-dom_client.js?v=f46fcb8a:12561
workLoopSync @ react-dom_client.js?v=f46fcb8a:12424
renderRootSync @ react-dom_client.js?v=f46fcb8a:12408
performWorkOnRoot @ react-dom_client.js?v=f46fcb8a:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=f46fcb8a:13505
performWorkUntilDeadline @ react-dom_client.js?v=f46fcb8a:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=f46fcb8a:247
(anonymous) @ index.tsx:17
(index):71 [FarmService] Initialized with 0 farms
(index):71 [FarmService] Global tokens reference set: 24 tokens
(index):71 [StoreContext] Set global tokens for farmService: 24
(index):71 [STORE] Initializing demo authentication...
(index):71 [STORE] Not authenticated, skipping moderation data load
(index):71 [TokenLaunchService] Showing launch: "✨ PCEO16 DEX Listing Live!" (graduation, rainbow)
(index):71 [EmojiSyncService] Initialized successfully
(index):71 [EmojiSyncService] Cleaned up successfully
(index):71 [Layout] Notifications updated: []
(index):71 [Layout] Notifications with links: []
(index):71 [Layout] Notifications without links: []
(index):71 [FarmService] Initialized with 0 farms
(index):71 [FarmService] Global tokens reference set: 24 tokens
(index):71 [StoreContext] Set global tokens for farmService: 24
(index):71 [STORE] Initializing demo authentication...
(index):71 [STORE] Not authenticated, skipping moderation data load
(index):71 [TokenLaunchService] Showing launch: "✨ SCOI1 DEX Listing Live!" (graduation, rainbow)
(index):71 [EmojiSyncService] Initialized successfully
persistence.js:32 ✅ Moat Persistence: IndexedDB initialized successfully
moat.js:2128 Moat: Starting moat initialization...
moat.js:2037 Moat: Theme initialized to dark
moat.js:1061 ✅ Moat: Google Fonts injected from moat.js (defensive check)
moat.js:1071 Moat: createMoat called, creating sidebar element...
moat.js:1075 Moat: Element created with class: float-moat
moat.js:1198 Moat: Sidebar element added to DOM
moat.js:3926 🌊 Moat: Animation system reset
moat.js:2118 Moat: Initializing content visibility, connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2631 Moat: Rendering empty sidebar
moat.js:1272 Moat: Event listeners attached
moat.js:2051 Moat: Logo updated for dark theme
moat.js:2142 🔧 Moat: Waiting for content script to restore connection...
moat.js:2051 Moat: Logo updated for dark theme
persistence.js:108 ✅ Moat Persistence: Directory handle retrieved successfully
(index):71 [PriceOracle] Price updated: $0.000007 (source: dexscreener, age: 0ms)
(index):71 [PriceOracle] Initialized successfully
(index):71 [PriceOracle] Price updated: $0.000007 (source: dexscreener, age: 0ms)
(index):71 [PriceOracle] Initialized successfully
(index):71 [STORE] Demo authentication successful
(index):71 [STORE] Demo authentication successful
persistence.js:178 ℹ️ Moat Persistence: Directory access test failed: The request is not allowed by the user agent or the platform in the current context.
persistence.js:307 ℹ️ Moat Persistence: Stored handle is no longer accessible
(index):71 [STORE] Loading moderation data from database...
persistence.js:157 🔴 Moat Persistence: Permission request failed: SecurityError: Failed to execute 'requestPermission' on 'FileSystemHandle': User activation is required to request permissions.
requestPermission @ persistence.js:157
await in requestPermission
restoreProjectConnection @ persistence.js:310
await in restoreProjectConnection
initializeProject @ content_script.js:635
initializeExtension @ content_script.js:4094
persistence.js:312 ❌ Moat Persistence: Permission could not be restored
content_script.js:691 ℹ️ Moat: Persistence restoration failed: Permission denied
content_script.js:695 🔄 Moat: Previous connection lost permission, user needs to reconnect
content_script.js:706 🔄 Moat: Checking localStorage for legacy connections...
content_script.js:741 🔧 Moat: No valid connections found - user must connect
content_script.js:746 🔧 Moat: Dispatching not-connected event (no path)
moat.js:3453 🔧 Moat: Received project-connected event: {status: 'not-connected', source: 'no-connection-found', eventSignature: 'not-connected-no-path-no-connection-found', timestamp: 1767361783337}
moat.js:525 🔧 ConnectionManager: Processing connection event: {status: 'not-connected', source: 'no-connection-found', eventSignature: 'not-connected-no-path-no-connection-found', timestamp: 1767361783337}
moat.js:391 🔧 ConnectionManager: Setting disconnected state
moat.js:3477 🔧 Moat: Processing disconnection event...
moat.js:2118 Moat: Initializing content visibility, connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2631 Moat: Rendering empty sidebar
content_script.js:143 🔧 Moat: Initialization attempt 1/3
content_script.js:90 🔧 Moat: Initializing TaskStore and MarkdownGenerator utilities...
content_script.js:91 🔧 Moat: window.MoatTaskStore available: true
content_script.js:92 🔧 Moat: window.MoatMarkdownGenerator available: true
content_script.js:93 🔧 Moat: window.directoryHandle available: false
content_script.js:105 ⚠️ Moat: TaskStore created but not initialized (no directory handle)
content_script.js:108 🔧 Moat: TaskStore instance: TaskStore {tasks: Array(0), directoryHandle: null}
content_script.js:122 ✅ Moat: MarkdownGenerator initialized successfully
content_script.js:123 🔧 Moat: MarkdownGenerator functions: (8) ['generateMarkdownFromTasks', 'rebuildMarkdownFromJson', 'rebuildMarkdownFile', 'writeMarkdownToFile', 'generateTaskStats', 'statusToCheckbox', 'truncateComment', 'sortTasksByTimestamp']
content_script.js:133 🔧 Moat: Exposing initialized instances to global window...
content_script.js:136 🔧 Moat: Global exposure complete - window.taskStore: true
content_script.js:137 🔧 Moat: Global exposure complete - window.markdownGenerator: true
content_script.js:149 ✅ Moat: All utilities initialized successfully
content_script.js:154 🔧 Moat: Instances exposed to global window during retry
content_script.js:610 Moat: Extension loaded successfully
content_script.js:621 🚀 Moat: Initializing project with persistence system...
content_script.js:4106 ✅ Moat extension initialized
content_script.js:4107 🔧 Moat: To connect to project, press Cmd+Shift+P or run setupProject()
persistence.js:108 ✅ Moat Persistence: Directory handle retrieved successfully
persistence.js:178 ℹ️ Moat Persistence: Directory access test failed: The request is not allowed by the user agent or the platform in the current context.
persistence.js:307 ℹ️ Moat Persistence: Stored handle is no longer accessible
persistence.js:157 🔴 Moat Persistence: Permission request failed: SecurityError: Failed to execute 'requestPermission' on 'FileSystemHandle': User activation is required to request permissions.
requestPermission @ persistence.js:157
await in requestPermission
restoreProjectConnection @ persistence.js:310
await in restoreProjectConnection
initializeProject @ content_script.js:635
initializeQueue @ content_script.js:613
initializeUI @ content_script.js:4117
initializeExtension @ content_script.js:4097
persistence.js:312 ❌ Moat Persistence: Permission could not be restored
content_script.js:691 ℹ️ Moat: Persistence restoration failed: Permission denied
content_script.js:695 🔄 Moat: Previous connection lost permission, user needs to reconnect
content_script.js:706 🔄 Moat: Checking localStorage for legacy connections...
content_script.js:741 🔧 Moat: No valid connections found - user must connect
content_script.js:746 🔧 Moat: Dispatching not-connected event (no path)
(index):59 ReferenceError: Cannot access 'sortedTokens' before initialization
    at Home (Home.tsx:127:15)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=f46fcb8a:18509:20)
    at renderWithHooks (react-dom_client.js?v=f46fcb8a:5654:24)
    at updateFunctionComponent (react-dom_client.js?v=f46fcb8a:7475:21)
    at beginWork (react-dom_client.js?v=f46fcb8a:8484:199)
    at runWithFiberInDEV (react-dom_client.js?v=f46fcb8a:997:72)
    at performUnitOfWork (react-dom_client.js?v=f46fcb8a:12561:98)
    at workLoopSync (react-dom_client.js?v=f46fcb8a:12424:43)
    at renderRootSync (react-dom_client.js?v=f46fcb8a:12408:13)
    at performWorkOnRoot (react-dom_client.js?v=f46fcb8a:11827:37)

The above error occurred in the <Home> component.

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.

error @ (index):59
defaultOnCaughtError @ react-dom_client.js?v=f46fcb8a:7001
logCaughtError @ react-dom_client.js?v=f46fcb8a:7033
runWithFiberInDEV @ react-dom_client.js?v=f46fcb8a:997
inst.componentDidCatch.update.callback @ react-dom_client.js?v=f46fcb8a:7078
callCallback @ react-dom_client.js?v=f46fcb8a:5491
commitCallbacks @ react-dom_client.js?v=f46fcb8a:5503
runWithFiberInDEV @ react-dom_client.js?v=f46fcb8a:997
commitClassCallbacks @ react-dom_client.js?v=f46fcb8a:9490
commitLayoutEffectOnFiber @ react-dom_client.js?v=f46fcb8a:9958
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=f46fcb8a:10792
commitLayoutEffectOnFiber @ react-dom_client.js?v=f46fcb8a:10074
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=f46fcb8a:10792
commitLayoutEffectOnFiber @ react-dom_client.js?v=f46fcb8a:9963
flushLayoutEffects @ react-dom_client.js?v=f46fcb8a:12924
commitRoot @ react-dom_client.js?v=f46fcb8a:12803
commitRootWhenReady @ react-dom_client.js?v=f46fcb8a:12016
performWorkOnRoot @ react-dom_client.js?v=f46fcb8a:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=f46fcb8a:13505
performWorkUntilDeadline @ react-dom_client.js?v=f46fcb8a:36
<...>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=f46fcb8a:247
AppContent @ App.tsx:48
react_stack_bottom_frame @ react-dom_client.js?v=f46fcb8a:18509
renderWithHooksAgain @ react-dom_client.js?v=f46fcb8a:5729
renderWithHooks @ react-dom_client.js?v=f46fcb8a:5665
updateFunctionComponent @ react-dom_client.js?v=f46fcb8a:7475
beginWork @ react-dom_client.js?v=f46fcb8a:8525
runWithFiberInDEV @ react-dom_client.js?v=f46fcb8a:997
performUnitOfWork @ react-dom_client.js?v=f46fcb8a:12561
workLoopSync @ react-dom_client.js?v=f46fcb8a:12424
renderRootSync @ react-dom_client.js?v=f46fcb8a:12408
performWorkOnRoot @ react-dom_client.js?v=f46fcb8a:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=f46fcb8a:13505
performWorkUntilDeadline @ react-dom_client.js?v=f46fcb8a:36
(index):59 Uncaught error: ReferenceError: Cannot access 'sortedTokens' before initialization
    at Home (Home.tsx:127:15)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=f46fcb8a:18509:20)
    at renderWithHooks (react-dom_client.js?v=f46fcb8a:5654:24)
    at updateFunctionComponent (react-dom_client.js?v=f46fcb8a:7475:21)
    at beginWork (react-dom_client.js?v=f46fcb8a:8484:199)
    at runWithFiberInDEV (react-dom_client.js?v=f46fcb8a:997:72)
    at performUnitOfWork (react-dom_client.js?v=f46fcb8a:12561:98)
    at workLoopSync (react-dom_client.js?v=f46fcb8a:12424:43)
    at renderRootSync (react-dom_client.js?v=f46fcb8a:12408:13)
    at performWorkOnRoot (react-dom_client.js?v=f46fcb8a:11827:37) {componentStack: '\n    at Suspense (<anonymous>)\n    at div (<anonym…   at main (<anonymous>)\n    at div (<anonymous>)'}
error @ (index):59
componentDidCatch @ ErrorBoundary.tsx:29
react_stack_bottom_frame @ react-dom_client.js?v=f46fcb8a:18547
inst.componentDidCatch.update.callback @ react-dom_client.js?v=f46fcb8a:7086
callCallback @ react-dom_client.js?v=f46fcb8a:5491
commitCallbacks @ react-dom_client.js?v=f46fcb8a:5503
runWithFiberInDEV @ react-dom_client.js?v=f46fcb8a:997
commitClassCallbacks @ react-dom_client.js?v=f46fcb8a:9490
commitLayoutEffectOnFiber @ react-dom_client.js?v=f46fcb8a:9958
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=f46fcb8a:10792
commitLayoutEffectOnFiber @ react-dom_client.js?v=f46fcb8a:10074
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=f46fcb8a:10792
commitLayoutEffectOnFiber @ react-dom_client.js?v=f46fcb8a:9963
flushLayoutEffects @ react-dom_client.js?v=f46fcb8a:12924
commitRoot @ react-dom_client.js?v=f46fcb8a:12803
commitRootWhenReady @ react-dom_client.js?v=f46fcb8a:12016
performWorkOnRoot @ react-dom_client.js?v=f46fcb8a:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=f46fcb8a:13505
performWorkUntilDeadline @ react-dom_client.js?v=f46fcb8a:36
(index):71 [EmojiSyncService] Cleaned up successfully
(index):71 [STORE] Loaded 1 warnings from database
(index):71 [STORE] Loaded 0 bans from database
(index):71 [STORE] Loaded 9 admin actions from database
(index):71 [STORE] ✅ Moderation data loaded successfully
moat.js:2246 🔧 Moat: Updating UI with connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2254 🔧 Moat: Found DOM elements: {indicator: true, label: true, chevron: true, divider: true, button: true}
moat.js:2270 🔧 Moat: Set label text to: Disconnected
moat.js:2276 🔧 Moat: Set tooltip to: Click to connect to project
moat.js:2284 🔧 Moat: UI update complete
moat.js:2149 🔧 Moat: Starting connection verification with proper timing...
moat.js:2289 🔧 Moat: Verifying initial connection...
moat.js:414 🔧 ConnectionManager: Starting connection verification
moat.js:372 🔧 ConnectionManager: State updated: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: true, isConnected: false, …}
moat.js:2246 🔧 Moat: Updating UI with connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: true, isConnected: false, …}
moat.js:2254 🔧 Moat: Found DOM elements: {indicator: true, label: true, chevron: true, divider: true, button: true}
moat.js:2270 🔧 Moat: Set label text to: Disconnected
moat.js:2276 🔧 Moat: Set tooltip to: Click to connect to project
moat.js:2284 🔧 Moat: UI update complete
moat.js:2118 Moat: Initializing content visibility, connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: true, isConnected: false, …}
moat.js:2631 Moat: Rendering empty sidebar
moat.js:420 🔧 ConnectionManager: No directory handle, checking for restoration
moat.js:461 🔧 ConnectionManager: Attempting to restore connection
persistence.js:108 ✅ Moat Persistence: Directory handle retrieved successfully
persistence.js:178 ℹ️ Moat Persistence: Directory access test failed: The request is not allowed by the user agent or the platform in the current context.
persistence.js:307 ℹ️ Moat Persistence: Stored handle is no longer accessible
persistence.js:157 🔴 Moat Persistence: Permission request failed: SecurityError: Failed to execute 'requestPermission' on 'FileSystemHandle': User activation is required to request permissions.
requestPermission @ persistence.js:157
await in requestPermission
restoreProjectConnection @ persistence.js:310
await in restoreProjectConnection
attemptRestore @ moat.js:466
verifyConnection @ moat.js:421
verifyInitialConnection @ moat.js:2292
initializeMoat @ moat.js:2150
await in initializeMoat
(anonymous) @ moat.js:3804
persistence.js:312 ❌ Moat Persistence: Permission could not be restored
moat.js:391 🔧 ConnectionManager: Setting disconnected state
moat.js:372 🔧 ConnectionManager: State updated: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2246 🔧 Moat: Updating UI with connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2254 🔧 Moat: Found DOM elements: {indicator: true, label: true, chevron: true, divider: true, button: true}
moat.js:2270 🔧 Moat: Set label text to: Disconnected
moat.js:2276 🔧 Moat: Set tooltip to: Click to connect to project
moat.js:2284 🔧 Moat: UI update complete
moat.js:2118 Moat: Initializing content visibility, connection state: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2631 Moat: Rendering empty sidebar
moat.js:2294 🔧 Moat: Connection verification complete: {status: 'not-connected', path: null, directoryHandle: null, isVerifying: false, isConnected: false, …}
moat.js:2305 ❌ Moat: No valid connection found
moat.js:2105 Moat: Restoring visibility state from localStorage: false
moat.js:2111 Moat: Moat will remain hidden based on saved state
moat.js:2181 Moat: DOM monitoring started
moat.js:2158 Moat: Moat initialization complete
moat.js:973 🔔 Notification request: Press C to make a comment info content-script
moat.js:798 🔔 Header Notification: Press C to make a comment info content-script
moat.js:858 🔔 Processing header notification: Press C to make a comment info content-script 
