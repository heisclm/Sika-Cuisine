# Sika Cuisine Frontend Architecture & Redesign Audit Log

## 1. Unified Design System (`packages/shared`, Web, Mobile)
- **Canonical Palette**: Replaced fragmented orange, gold (`brand-gold`, `#f59e0b`, `#FF6600`, `#F79E1B`), and legacy dark hexes (`#e50914`, `#e11d48`, `#11110f`, `#0c0d12`) with one unified token system in [`packages/shared/src/design-tokens.ts`](../packages/shared/src/design-tokens.ts):
  - Deep Black `#101010` (`deepBlack`), Charcoal `#1C1C1C` (`charcoal`), Elevated Surface `#262626` (`elevatedSurface`), Border `#333333` (`border`).
  - Crimson Brand Red `#D71920` (`primaryRed`), Pressed `#A91017` (`darkerRed`), Accessible Red Text `#F0444A` (`lightRed`), Warm White `#F5F1EA` (`warmWhite`).
  - Semantic statuses: Success `#22C55E` (`#4ADE80`), Warning `#EAB308` (`#FACC15`), Error `#FB7185` (`#FDA4AF`) kept visually distinct from primary brand red.
- **Navigation Single Source of Truth**: [`packages/shared/src/navigation.ts`](../packages/shared/src/navigation.ts) defines `WEB_PRIMARY_NAV` (Home, Menu, Orders, About, Contact), `MOBILE_TAB_NAV` (Home, Menu, Orders, Account), and `RESTAURANT_INFO` (`0533376760` / `0554406681`, Sunyani Central).

## 2. Next.js 16 Web Application (`apps/web`)
- **Motion & Accessibility**: Added `<MotionProvider>` (`MotionConfig reducedMotion="user"`), skip-to-content link, `#main-content` landmark in root layout, focus-trap + Escape dismissal + trigger focus restoration on `<MobileMenu />` and `<ConfirmDialog />`, and `<Suspense>` around `useSearchParams()` in `/menu`.
- **Defects Resolved**:
  - Removed unresolved git merge conflicts in `/forgot-password` and replaced with direct Sunyani verification contact guidance (`0533376760` / WhatsApp).
  - Replaced mock profile data in `/account` with live `/api/v1/auth/me`, `/api/v1/orders/my-orders`, and `ConfirmDialog` + `POST /api/v1/auth/logout`.
  - Fixed `SAMPLE_ORDERS` `ReferenceError` in `/orders` and added verified reference lookup via `/api/v1/orders/track/[orderNumber]`.
  - Fixed `/orders/[orderNumber]` timeline to query chronological `statusHistory` and render shared `<OrderTimeline />` progression.
  - Synchronized `CASH_ON_DELIVERY` <-> `CASH_ON_COLLECTION` on Delivery/Pickup toggle in `/checkout`, normalized phone digits against `phoneRegex`, and added `/api/v1/auth/me` prefill.
  - Wired `/admin/login` and `/rider/login` to real `POST /api/v1/auth/login` verifying Prisma `Role` values (`ADMIN`/`STAFF_CASHIER`/`STAFF_KITCHEN` vs `DELIVERY_RIDER`); updated `/admin` KDS to query `?includeUnavailable=true`, combine `CASH_ON_DELIVERY` + `CASH_ON_COLLECTION` in handover cash summary, and enforce `getAllowedNextStatuses()` + `<ConfirmDialog />` before `REJECTED`/`CANCELLED`.
  - Added dedicated `/menu/[slug]` product customization page and `/api/v1/auth/logout` endpoint.

## 3. Native Mobile Application (`apps/mobile`, Expo SDK 58)
- **Design Parity & Iconography**: Added [`apps/mobile/src/theme.ts`](../apps/mobile/src/theme.ts), [`apps/mobile/src/context/ToastContext.tsx`](../apps/mobile/src/context/ToastContext.tsx), and reusable UI kit primitives (`Button`, `Badge`, `Skeleton`, `EmptyState`, `ErrorState`, `FilterSheet`) using `lucide-react-native` exclusively (zero emojis or legacy hex codes).
- **Local Asset Bundler**: Added static photography mapping in [`apps/mobile/src/data/dish-images.ts`](../apps/mobile/src/data/dish-images.ts) covering all bundled dish photos, `lounge-interior.jpg`, and `logo.png`.
- **Redesigned Flows**:
  - Three-slide swipeable `OnboardingScreen` with `expo-linear-gradient` scrims, animated pagination indicators, Skip, Back, Continue/Get Started controls, and Profile replay support.
  - Dedicated `HomeScreen` featuring search, `FilterSheet` trigger, horizontal featured carousel, compact category chips routing to pre-filtered `MenuScreen`, and Sunyani delivery vs free counter pickup showcase.
  - Refactored `MenuScreen`, `DishCard`, `DishDetailModal`, `CartScreen`, `CheckoutScreen` (`KeyboardAvoidingView`, contact prefill, cash variant sync, offline queue preservation), `OrdersScreen` (lookup + history + skeletons), `OrderTrackingScreen` (Back button + `NetInfo` auto-sync + timestamped `OrderStatusTimeline` + `OfflineBanner`), `AuthScreen`, `ProfileScreen` (Expo SDK 58 label, dialer links, Sunyani tariffs, onboarding replay), and `App.tsx` (`SafeAreaProvider` + `MOBILE_TAB_NAV` tab bar).

## 4. Verification Summary (Latest Run)
- `npm test`: Passed (22/22 tests passed, 0 failed, 0 skipped).
- `npx tsc --noEmit -p apps/web/tsconfig.json`: Exited with code 0.
- `npm run typecheck --workspace=@sika/mobile`: Exited with code 0.
- `npm run build --workspace=@sika/web`: Succeeded with exit code 0 (32/32 App Router routes built; emits Next.js 16.4.2 security advisory notice recommending upgrade).
- `cd apps/mobile && npx expo config --type public`: Exited with code 0 (`sdkVersion: '58.0.0'`, splash/adaptiveIcon `#101010`).
- Token & mobile emoji hygiene scans (`Select-String`): Exited with code 0, zero violations found.
- Live `next start -p 3055` HTTP smoke probe: All 12 checked customer & login SSR routes returned HTTP 200 with Sika shell markup (`/` through `/rider/login`). Note: live PostgreSQL-backed mutations and physical Expo Go device visual verification depend on local DB (`DATABASE_URL`) and phone/emulator preview.
