# Copilot Instructions - SulekApp

## ⚠️ CRITICAL: Agent Delegation Policy

**ALWAYS use the Orchestrator agent for ANY task in this project.**

- ✅ **DO:** Delegate to `.github/copilot/agents/orchestrator/agent.md`
- ❌ **DON'T:** Use the general-purpose agent or other built-in agents
- ❌ **DON'T:** Work directly on tasks yourself

The Orchestrator coordinates a specialized team (Screen Expert, API Expert, UI Expert, QA Tester) that ensures quality, consistency, and proper testing. See `.github/copilot/agents/README.md` for details.

**Example:**
```
User: "Add delete button to WorkoutDetailScreen"
You: [Delegate to Orchestrator agent]
```

---

## ⚠️ CRITICAL: Always Ask Before Editing

**NEVER edit, create, or delete files without explicit permission.**

- ✅ **DO:** Propose changes and ask for approval first
- ✅ **DO:** Explain what needs to change and why
- ✅ **DO:** Show code diffs or examples in your explanation
- ❌ **DON'T:** Make changes directly, even if they seem obvious or trivial
- ❌ **DON'T:** Assume permission based on previous approvals

**Exception:** Session workspace files (`~/.copilot/session-state/`) like plan.md, notes, guides are okay to create/edit without asking.

**Example:**
```
User: "Fix the API connection"
You: "I found the issue in CardioDetailScreen.tsx on line 52. May I update it to use getApiBaseUrl()?"
```

---

## Project Overview

This is a Swedish-language workout tracking mobile app built with React Native (Expo) and TypeScript. The app connects to a .NET backend API running on `localhost:5026` and uses MSSQL database (via Docker).

## Build & Run Commands

```bash
# Start Expo dev server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Start backend database (MSSQL)
docker-compose up -d
```

## Architecture

### Navigation Structure

The app uses React Navigation Bottom Tabs with a flat navigation structure:

- **HomeScreen** - Main entry point showing recent workouts
- **CreateWorkoutScreen** - Create new workouts (hidden from tab bar, navigated with params `{ date: string }`)
- **CalenderScreen** - Calendar view of workouts
- **ProgressScreen** - Workout statistics and progress tracking
- **WorkoutDetailScreen** - View/edit specific workout (hidden from tab bar, navigated with params `{ date: string }`)
- **ProfileScreen** - User profile (hidden from tab bar)

All screens are registered as Tab.Screen components in `App.tsx`, with some hidden from the tab bar using `tabBarButton: () => null`. Navigation types are defined in `navigations/types.ts` as `RootTabParamList`.

### Data Flow Pattern

**All API calls are made directly in screen components** using fetch. There is no centralized API service layer or state management library.

Pattern used in every screen:
```typescript
const apiBaseUrl = 'http://localhost:5026';

// Then fetch directly:
const response = await fetch(`${apiBaseUrl}/api/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**No AsyncStorage, Redux, or global state** - all state is local to screens with React's useState/useEffect.

### Key Data Types

Common DTO patterns found across screens:

```typescript
type WorkoutDto = {
  id?: number;
  name: string;
  workoutDate?: string;  // Format: YYYY-MM-DD
  notes?: string | null;
  completed?: boolean;
  cardioTimeMinutes?: number | null;
  cardioDistanceKm?: number | null;
  cardioCalories?: number | null;
  exercises?: ExerciseDto[];
};

type ExerciseDto = {
  name: string;
  workoutExerciseId?: number;
  exerciseId?: number;
  sets?: SetDto[];
};

type SetDto = {
  setNum: number;
  reps: number;
  weightKg?: number | null;
  notes?: string | null;
};
```

## Conventions

### Date Handling

Always use `toLocalDateString()` from `utils/date.ts` to format dates:
- Accepts `Date` or `string`
- Returns `YYYY-MM-DD` format
- Handles both Date objects and ISO strings

### Swedish Localization

- All UI text is in Swedish
- Calendar uses Swedish locale configured in `config/calendarLocale.ts` (react-native-calendars)
- Month/day names in Swedish

### Component Patterns

**Dropdown Component** (`components/Dropdown.tsx`):
- Controlled component supporting both single and multi-select
- Props: `value`, `onChange`, `onCreateItem` (for adding new items dynamically)
- Used for exercise selection with async item creation

**ProfileButton Component** (`components/ProfileButton.tsx`):
- Reusable profile navigation button

### Styling Conventions

- **Primary accent color**: `#14B8A6` (teal)
- **Tab bar height**: 88px with custom padding for iPhone safe area
- Uses `LinearGradient` from expo-linear-gradient for visual effects
- SafeAreaProvider wraps entire app for proper safe area handling

### Screen Lifecycle

Screens use `useFocusEffect` from `@react-navigation/native` to reload data when navigating back:

```typescript
useFocusEffect(
  useCallback(() => {
    // Reload data when screen comes into focus
    loadData();
  }, [dependencies])
);
```

## Backend Integration

- Backend API expected at `http://localhost:5026`
- MSSQL database runs in Docker (port 1433)
- API endpoints follow REST conventions: `/api/workouts`, `/api/exercises`, etc.
- All requests use `Content-Type: application/json`

## Dependencies of Note

- **react-native-calendars**: Calendar component with Swedish locale
- **react-native-maps**: Map integration for cardio tracking
- **expo-location**: GPS tracking for workouts
- **react-native-confetti-cannon**: Celebration effects
- **@expo-google-fonts/poppins**: Primary font
