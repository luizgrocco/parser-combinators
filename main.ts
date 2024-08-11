// Result
type Result<T, Error> = { ok: true; value: T } | { ok: false; err: Error };

// Parser Combinators
type ParseInput = string;
type ParseResult<T> = [Result<T, Error>, ParseInput];
export type Parser<T> = (input: ParseInput) => ParseResult<T>;

export const succeed = <T>(
  result: T,
  inputAfterOk: ParseInput,
): ParseResult<T> => [
  { ok: true, value: result },
  inputAfterOk,
];

// TODO: I have come to regret this decision, you will never use the remaining string when a parser fails.
export const fail = <T = never>(
  inputAfterFail: ParseInput,
  errMsg = "failed without a message",
): ParseResult<T> => [{ ok: false, err: new Error(errMsg) }, inputAfterFail];

type Char = string;

export const satisfy =
  (testFn: (c: Char) => boolean): Parser<Char> => (input: ParseInput) =>
    input.length > 0 && testFn(input[0])
      ? succeed(input[0], input.slice(1))
      : fail(input, `failed to parse ${input[0]}`);

export const char = <const T>(c: T): Parser<T> => (input: ParseInput) =>
  input.length > 0 && input[0] === c ? succeed(c, input.slice(1)) : fail(
    input,
    input.length === 0
      ? `failed to parse the char "${c}" on an empty input`
      : `failed to parse the char "${c}" on input "${input}"`,
  );

export const empty: Parser<""> = (input: ParseInput) => [
  { ok: true, value: "" },
  input,
];

export const literal =
  <T extends string>(literal: T): Parser<T> => (input: ParseInput) =>
    input.startsWith(literal)
      ? succeed(literal, input.slice(literal.length))
      : fail(input, `failed to parse literal "${literal}" on input "${input}"`);

export const map =
  <T, R>(parser: Parser<T>, fn: (arg: T) => R): Parser<R> =>
  (input: ParseInput) => {
    const [result, remainder] = parser(input);
    return result.ok
      ? succeed(fn(result.value), remainder)
      : [result, remainder];
  };

export const or =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<T | R> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);
    if (firstResult.ok) return [firstResult, firstRemainder];
    return secondParser(input);
  };

export const any =
  // deno-lint-ignore no-explicit-any
  <U, T extends any[]>(
    firstParser: Parser<U>,
    ...parsers: { [K in keyof T]: Parser<T[K]> }
  ): Parser<U | T[number]> =>
  (input: ParseInput) => {
    let [result, remainder] = firstParser(input);

    if (!result.ok) {
      for (const parser of parsers) {
        [result, remainder] = parser(input);
        if (result.ok) return [result, remainder];
      }
    }

    return [result, remainder];
  };

export const and =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<[T, R]> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);

    if (!firstResult.ok) return [firstResult, input];

    const [secondResult, remainder] = secondParser(firstRemainder);
    return secondResult.ok
      ? succeed([firstResult.value, secondResult.value], remainder)
      : [secondResult, input];
  };

// deno-lint-ignore no-explicit-any
export const sequence = <U, T extends any[]>(
  firstParser: Parser<U>,
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<[U, ...T]> =>
  parsers.reduce(
    (acc, parser) =>
      map(and(acc, parser), ([results, result]) => [...results, result]),
    map(firstParser, (result) => [result]),
  );

export const exactly =
  <T>(n: number, parser: Parser<T>): Parser<T[]> => (input: ParseInput) => {
    let inputRemainder = input;
    const resultAcc: T[] = [];

    for (let i = 0; i < n; i++) {
      const [result, remaining] = parser(inputRemainder);

      if (!result.ok) return [result, input];

      resultAcc.push(result.value);
      inputRemainder = remaining;
    }

    return succeed(resultAcc, inputRemainder);
  };

export const some =
  <T>(parser: Parser<T>): Parser<T[]> => (input: ParseInput) => {
    let [result, remainder] = parser(input);

    if (!result.ok) return [result, remainder];

    let inputRemainder = remainder;
    const resultAcc: T[] = [];
    do {
      resultAcc.push(result.value);
      inputRemainder = remainder;
      [result, remainder] = parser(inputRemainder);
    } while (result.ok && inputRemainder.length !== remainder.length);

    return succeed(resultAcc, inputRemainder);
  };

export const optional = <T>(parser: Parser<T>) => or(parser, empty);

export const precededBy = <T, R>(
  precedingParser: Parser<T>,
  parser: Parser<R>,
): Parser<R> => map(and(precedingParser, parser), ([, result]) => result);

export const succeededBy = <T, R>(
  succeedingParser: Parser<R>,
  parser: Parser<T>,
): Parser<T> => map(and(parser, succeedingParser), ([result]) => result);

export const joinedBy = <T, Q>(
  joiningParser: Parser<T>,
  parser: Parser<Q>,
): Parser<[Q, Q]> => and(succeededBy(joiningParser, parser), parser);

export const delimitedBy = <T, R, Q>(
  precedingParser: Parser<T>,
  succeedingParser: Parser<R>,
  parser: Parser<Q>,
): Parser<Q> =>
  precededBy(precedingParser, succeededBy(succeedingParser, parser));

export const surroundedBy = <T, Q>(
  surroundingParser: Parser<T>,
  parser: Parser<Q>,
) => delimitedBy(surroundingParser, surroundingParser, parser);

export const spaced = <T>(parser: Parser<T>): Parser<T> =>
  surroundedBy(optional(some(char(" "))), parser);

// TODO: A whole study can emerge around the topic of lookahead from considering what this parser should do
// const not = <T>(parser: Parser<T>): Parser<T> => (input: ParseInput) {
//   const [result] = parser(input)
// }

const positiveDigit = any(
  char("1"),
  char("2"),
  char("3"),
  char("4"),
  char("5"),
  char("6"),
  char("7"),
  char("8"),
  char("9"),
);

const zero = char("0");

const digit = any(zero, positiveDigit);

export const natural = map(
  some(digit),
  (digits) => parseInt(digits.join(""), 10),
);

export const integer = map(
  and(optional(char("-")), natural),
  (result) => parseInt(result.join(""), 10),
);

export const number = map(
  and(
    integer,
    optional(
      and(
        char("."),
        map(some(digit), (digits) => digits.join("")),
      ),
    ),
  ),
  ([integerPart, decimalPart]) =>
    decimalPart === ""
      ? integerPart
      : parseFloat(integerPart + decimalPart.join("")),
);

// TODO: The letter parser probably also belongs in the library
// const letter = (c: Char) => (input: ParseInput) => {
//   const [result, remainder] = char(c)(input);

//   if (result.ok) {
//     return ok<Uppercase<typeof result.value>>(
//       result.value.toUpperCase(),
//       remainder,
//     );
//   }
// };

const mathOperators = any(
  char("+"),
  char("-"),
  char("*"),
  char("/"),
  char("^")
);

const mathExpression = map(
  and(number, optional(many(and(mathOperators, number)))),
  ([number, rest]) => ({ lhs: number, rhs: rest })
);

// const mathParser = any(and(mathExpression, mathOperators) number)
