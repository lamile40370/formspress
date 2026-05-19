# FlowForms — Calculations engine

The **Calculation** field type lets you compute a value at runtime from
other fields' answers. It is a read-only field that renders the computed
value to the visitor and submits the value alongside the rest of the form.

Server-side, the `EntryProcessor` **recomputes** every calculation value
from the formula before persisting — so even if a visitor tampers with the
hidden input the stored amount is always the trusted server-computed one.
This is especially important when the calculation feeds the Stripe payment
action.

## Adding a calculation field

In the form builder, open the inserter, pick **Advanced → Calculation**,
and configure:

- **Formula** — the expression (see syntax below).
- **Format** — one of `number`, `currency`, `percent`, `integer`.
- **Currency code** — ISO-4217 code (`EUR`, `USD`, `GBP`, …) when format is
  currency.
- **Decimals** — number of decimals to show (0–8).
- **Show label** — whether the field's label is rendered.

## Syntax

### Variables

Reference any other field by id:

```
{field:qty} * {field:price}
```

Non-numeric values are coerced to `0`. Multi-select / checkbox answers are
treated as their selection-count.

### Operators

| Operator | Meaning              |
| -------- | -------------------- |
| `+`      | Addition             |
| `-`      | Subtraction          |
| `*`      | Multiplication       |
| `/`      | Division (`/0` → 0)  |
| `%`      | Modulo               |
| `( )`    | Grouping             |
| `==`     | Equal                |
| `!=`     | Not equal            |
| `>`      | Greater than         |
| `<`      | Less than            |
| `>=`     | Greater or equal     |
| `<=`     | Less or equal        |
| `&&`     | Logical AND          |
| `\|\|`   | Logical OR           |

Comparison operators evaluate to `1` or `0` so you can combine them inside
`if()`.

### Functions

| Function          | Description                                |
| ----------------- | ------------------------------------------ |
| `min(a, b, …)`    | Smallest of the arguments                  |
| `max(a, b, …)`    | Largest of the arguments                   |
| `abs(x)`          | Absolute value                             |
| `round(x[, n])`   | Round half-up to `n` decimals (default 0)  |
| `floor(x)`        | Round down                                 |
| `ceil(x)`         | Round up                                   |
| `if(cond, a, b)`  | Returns `a` if `cond` is truthy, else `b`  |
| `sum(a, b, …)`    | Sum of the arguments                       |
| `avg(a, b, …)`    | Mean of the arguments                      |

## Examples

### Price × Quantity

```
{field:qty} * {field:price}
```

### Add VAT @ 20%

```
{field:qty} * {field:price} * 1.20
```

### Volume discount

```
if({field:qty} >= 10, {field:price} * 0.9, {field:price}) * {field:qty}
```

### Stripe processing fee (2.9% + 0.30)

```
round({field:subtotal} * 0.029 + 0.30, 2)
```

### Total with order min

```
max( {field:subtotal} + {field:shipping}, 5 )
```

## Security

- The parser uses a strict **shunting-yard** implementation. There is no
  `eval()`; the only callable names are the whitelist above.
- AST depth is capped at 32 levels.
- Variables are restricted to `[A-Za-z0-9_-]`.
- A failed parse silently returns `0`, never an exception that bubbles up
  through the submission handler.

## Implementation pointers

- PHP evaluator — `src/Extensibility/FieldTypes/Calculations/FormulaEvaluator.php`
- JS evaluator  — `assets/frontend/calc-evaluator.js`
- Field type    — `src/Extensibility/FieldTypes/Types/CalculationFieldType.php`
- Server recompute — `EntryProcessor::apply_calculations()`
