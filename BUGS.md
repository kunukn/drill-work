# NavAIgator findings

Each entry: component → expected vs actual → repro.

## 1. `InlineLink` is missing `asChild` while sibling components have it

- **Component**: `InlineLink` (`@dfds-ui/navaigator`)
- **Expected**: Same `asChild` Slot pattern as `Button` and `Text`, so a router `Link` can be styled as an `InlineLink` without nesting `<a>` inside `<a>`.
- **Actual**: `InlineLink` is implemented as a plain `<a>` — passing `asChild` produces a TS error (`Property 'asChild' does not exist`) and renders an invalid nested-anchor structure if forced.
- **Repro**: `<InlineLink asChild><Link to="/x">go</Link></InlineLink>` — TS2322. Confirmed in `dist/components/navaigator/inline-link.js`: the component renders `<a>` and spreads `props`; `asChild` is not in its props type.
- **Workaround**: had to fall back to `<Button asChild variant="link">` for back-links, even though semantically these are inline links, not buttons.

## 2. No `danger` / `destructive` `Button` variant

- **Component**: `Button` variants
- **Expected**: A destructive variant (red fill, used for delete actions) — standard in Material, shadcn, Carbon, Polaris, etc.
- **Actual**: Variants are only `primary | secondary | ghost-primary | ghost-secondary | link`. Delete buttons end up as `secondary` (outlined neutral), which gives no visual signal that the action is destructive.
- **Repro**: `<Button variant="destructive">Delete</Button>` → TS error; `<Button variant="secondary">Delete</Button>` renders identical to a non-destructive outline button. See `bookings.$id.tsx` Delete action.

## 3. `Select` requires a manual content child for the trigger label

- **Component**: `Select` / `SelectTrigger`
- **Expected**: Setting `value` on `<Select>` should display the matching `<SelectItem>`'s label automatically (Radix UI's `<SelectValue placeholder=...>` pattern is the de-facto standard).
- **Actual**: `SelectTrigger` does **not** expose `<SelectValue>`. To show the current selection you must pass the rendered label as `children` to `SelectTrigger` and resolve the label yourself from the `value`. This makes simple selects verbose, and decouples the displayed label from the actual selected option (easy to drift).
- **Repro**: see `bookings.index.tsx` filter selects — every `<SelectTrigger>` has a manual `customers.find((c) => c.id === form.customerId)?.name ?? "Select customer…"` ternary. Compare with what shadcn/Radix Select normally is:
  ```tsx
  <SelectTrigger>
    <SelectValue placeholder="Select…" />
  </SelectTrigger>
  ```

## 4. `Select` rejects empty-string `value`, forcing a sentinel

- **Component**: `Select` / `SelectItem`
- **Expected**: `<SelectItem value="">All</SelectItem>` should be allowed for "no selection / clear filter" semantics — common in filter UIs.
- **Actual**: Radix forbids `""` as an item value (silently breaks selection / throws in dev). The library inherits this behavior with no opinionated escape hatch (no `<SelectClear>`, no `allowClear`, etc.).
- **Workaround**: Introduce a `__all__` sentinel and translate it in/out of state (see `bookings.index.tsx` `const ALL`). Boilerplate every consumer has to re-invent.

## 5. Required-asterisk renders **before** the label, not after

- **Component**: `TextInput`, `FieldLabel` (and any field with `required`)
- **Expected**: Most DS conventions (Material, Carbon, Polaris, GOV.UK) render `Label *` — asterisk _after_ the label, often slightly raised.
- **Actual**: NavAIgator renders `* Label` — asterisk leads, in red, attached to the label start. Visually scans as a bullet/list-marker rather than a required indicator. This is plausibly intentional, but inconsistent with the rest of the industry and with DFDS's own patterns elsewhere — worth confirming with design.
- **Repro**: any `<TextInput label="Origin" required />` in `bookings.$id.tsx`. Visible in `/bookings/<id>`.

## 6. No form composition primitives (`Form`, `FormField`, `FormGroup`)

- **Component**: missing exports
- **Expected**: Some form orchestration component that ties together label / control / error / assistive-text / id wiring (cf. shadcn `Form`, react-hook-form's `Field`, Polaris `FormLayout`).
- **Actual**: `TextInput` carries `label` / `errorMessage` / `assistiveText` props, but `Select` requires a separate `<FieldLabel>` import from `@dfds-ui/navaigator/shared/field`, and there is no shared id/aria wiring. Each form re-invents grid layout, focus order, and error coordination.
- **Impact**: every form in the app duplicates the same `<div><FieldLabel>…</FieldLabel><Select>…</Select></div>` pattern. Worth a `Field` wrapper that takes `label`, `errorMessage`, `required` and renders the appropriate label/control pair regardless of which control is used.

## 7. Stylesheet re-emits unprefixed Tailwind utilities, breaking responsive variants

- **Component**: `@dfds-ui/navaigator/styles.css`
- **Expected**: A component library's stylesheet should not redefine generic Tailwind utility classes (`.grid-cols-2`, `.grid-cols-3`, `.grid-cols-4`) at the top level. Consumers expect their own Tailwind variants (`lg:grid-cols-5`, etc.) to win at their breakpoint.
- **Actual**: `dist/styles.css` lines 1929–1957 emit unprefixed `.grid-cols-1..4` rules (and similar elsewhere). Because consumers typically `@import "tailwindcss"` first and the library stylesheet second, navaigator's `.grid-cols-2` ends up _later_ in source order than Tailwind's `.lg:grid-cols-5` variant rule. Equal specificity → the unprefixed base wins even at `≥1024px`, silently squashing the responsive variant.
- **Repro**: `<div className="grid grid-cols-2 lg:grid-cols-5">…</div>` at viewport ≥1024px renders as 2 columns. Computed `grid-template-columns` is `repeat(2, …)`. The variant rule is in the cascade (DevTools shows it) but is overridden by the later `.grid-cols-2` from navaigator.
- **Workaround**: import order swap in `src/styles.css` — put `@import "@dfds-ui/navaigator/styles.css"` _before_ `@import "tailwindcss"`. Fragile (any future utility emitted by navaigator that the app also uses unprefixed could re-trigger this in reverse).
- **Suggested fix upstream**: don't emit unprefixed generic utilities; or wrap the library's CSS in `@layer components` so consumer utilities always win regardless of import order.

## 8. NavAIgator MCP endpoint returns 404

- **Component**: `.mcp.json` server entry → `https://nav-a-igator.vercel.app/mcp`
- **Expected**: Per the challenge README, the NavAIgator Storybook exposes an HTTP MCP server at `/mcp` so AI editors can introspect components, props, tokens, and stories.
- **Actual**: `GET https://nav-a-igator.vercel.app/mcp` responds with **HTTP 404**. The MCP client fails to initialize; no NavAIgator tools become available in the editor. The Storybook itself at `https://nav-a-igator.vercel.app/` loads fine, so the deployment is up — only the `/mcp` route is missing.
- **Repro**: `curl -s -o /dev/null -w "%{http_code}\n" https://nav-a-igator.vercel.app/mcp` → `404`. Same result from Claude Code on first run after approving `.mcp.json`.
- **Workaround**: browse component docs manually at <https://nav-a-igator.vercel.app/> and read the published types from `node_modules/@dfds-ui/navaigator` instead.

## 9. Component names collide with DOM globals, blocking auto-import

- **Component**: `Notification`, `Text` (and likely others — `Image`, `Option`, `Range`, `Selection`, `Form`, `Header`, `Footer`, `Document`, `Event`, `Location`)
- **Expected**: A component library's exported names should not shadow standard DOM globals, so consumers can use tooling like `unplugin-auto-import` to declare them as ambient globals without TypeScript resolving the wrong symbol.
- **Actual**: `Notification` and `Text` are also names of built-in browser classes (`window.Notification`, the DOM `Text` node), declared globally in `lib.dom.d.ts`. When `unplugin-auto-import` generates `declare global { const Notification: typeof import('@dfds-ui/navaigator').Notification }`, the DOM type wins the merge and JSX usage fails with `TS2786: 'Notification' cannot be used as a JSX component` (its type resolves to the DOM constructor, which has no `props`).
- **Repro**: add `Notification` / `Text` to `auto-import.config.ts` under `@dfds-ui/navaigator`, remove the explicit import from `src/routes/bookings.$id.tsx`, run `pnpm typecheck` → `TS2607` + `TS2786` on every `<Notification>` and `<Text>` JSX node.
- **Workaround**: keep `Notification` and `Text` (and any other DOM-colliding names) as explicit `import { Notification, Text } from "@dfds-ui/navaigator"` rather than auto-imports.
- **Suggested fix upstream**: rename to non-colliding identifiers (`Toast` / `Banner` / `Alert` for `Notification`; `Typography` / `Txt` for `Text`) — this is the convention shadcn, Chakra, MUI, and Mantine all follow.

## 10. No datetime picker — `DatePicker` is date-only

- **Component**: `DatePicker`
- **Expected**: Either a datetime mode on `DatePicker`, or a separate `DateTimePicker` — freight bookings care about hours/minutes (vessel departures).
- **Actual**: `DatePickerProps` accepts only `Date` (calendar UI, no time field). For datetime fields we have to fall back to native `<input type="datetime-local">` via `TextInput`, which gives a non-DFDS-skinned native picker UI.
- **Repro**: `bookings.$id.tsx` "Departure Date" and "Arrival Date" use `TextInput type="datetime-local"` because `DatePicker` has no datetime variant.
