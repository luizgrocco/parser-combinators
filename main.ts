import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";

// Result
type Result<T, Error> =
  | { ok: true; value: T }
  | { ok: false; err: Error };

// Parser Combinators
type ParseInput = string;
type ParseResult<T> = [Result<T, Error>, ParseInput];
export type Parser<T> = (input: ParseInput) => ParseResult<T>;

const ok = <T>(
  result: T,
  inputAfterOk: ParseInput,
): ParseResult<T> => [{ ok: true, value: result }, inputAfterOk];

const fail = <T = never>(
  inputAfterFail: ParseInput,
  errMsg = "failed without a message",
): ParseResult<T> => [
  { ok: false, err: new Error(`[Error]: ${errMsg}`) },
  inputAfterFail,
];

type Char = string;

const satisfy =
  (test: (c: Char) => boolean): Parser<string> => (input: ParseInput) =>
    input.length === 0
      ? fail(input, `input's length is 0`)
      : test(input.at(0)!)
      ? ok(input.at(0)!, input.slice(1))
      : fail(input, `failed to parse ${input[0]}`);

Deno.test(function satisfyTest() {
  const satisfyLuiz = satisfy(
    (c) => ["L", "u", "i", "z"].includes(c),
  );

  assertEquals(satisfyLuiz("L"), ok("L", ""));
  assertEquals(satisfyLuiz("u"), ok("u", ""));
  assertEquals(satisfyLuiz("i"), ok("i", ""));
  assertEquals(satisfyLuiz("z"), ok("z", ""));
  assertEquals(satisfyLuiz("b"), fail("b"));
  assertEquals(satisfyLuiz("c"), fail("c"));
  assertEquals(satisfyLuiz("d"), fail("d"));
});

const char = (c: Char): Parser<Char> => satisfy((input) => input === c);

Deno.test(function charTest() {
  const charA = char("a");
  const charL = char("l");
  const charZ = char("Z");
  assertEquals(charA("abc"), ok("a", "bc"));
  assertEquals(charL("luiz"), ok("l", "uiz"));
  assertEquals(charL("Luiz"), fail("Luiz"));
  assertEquals(charZ("Zillow"), ok("Z", "illow"));
  assertEquals(charZ("z"), fail("z"));
});

const and =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<[T, R]> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);
    if (firstResult.ok) {
      const [secondResult, remainder] = secondParser(firstRemainder);
      return secondResult.ok
        ? ok([firstResult.value, secondResult.value], remainder)
        : [secondResult, remainder];
    } else {
      return [firstResult, firstRemainder];
    }
  };

Deno.test(function andTest() {
  const parseAandB = and(char("a"), char("b"));
  const parseLandU = and(char("l"), char("u"));
  const parseZill = and(and(char("z"), char("i")), and(char("l"), char("l")));
  assertEquals(parseAandB("ab"), ok(["a", "b"], ""));
  assertEquals(parseLandU("luiz"), ok(["l", "u"], "iz"));
  assertEquals(parseZill("zillow"), ok([["z", "i"], ["l", "l"]], "ow"));
});

const or =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<T | R> =>
  (input: ParseInput) => {
    const firstParseResult = firstParser(input);
    if (firstParseResult[0].ok) return firstParseResult;
    const secondParseResult = secondParser(input);
    if (secondParseResult[0].ok) return secondParseResult;
    return secondParseResult;
  };

Deno.test(function orTest() {
  const parseAorB = or(char("a"), char("b"));
  const parseLorU = or(char("l"), char("u"));
  const parseZiorll = or(and(char("z"), char("i")), and(char("l"), char("l")));
  assertEquals(parseAorB("a"), ok("a", ""));
  assertEquals(parseAorB("b"), ok("b", ""));
  assertEquals(parseLorU("luiz"), ok("l", "uiz"));
  assertEquals(parseLorU("urs"), ok("u", "rs"));
  assertEquals(parseZiorll("zi"), ok(["z", "i"], ""));
  assertEquals(parseZiorll("ll"), ok(["l", "l"], ""));
});

const map = <T, R>(
  parser: Parser<T>,
  fn: (arg: T) => R,
): Parser<R> =>
(input: ParseInput) => {
  const parserResult = parser(input);
  return parserResult[0].ok
    ? ok(fn(parserResult[0].value), parserResult[1])
    : parserResult as ParseResult<R>;
};

Deno.test(function mapTest() {
  const charMap = map(char("a"), (char) => ({
    char,
  }));

  assertEquals(charMap("a"), ok({ char: "a" }, ""));
});

const pipe = (...parsers: Parser<string>[]): Parser<string> =>
(
  input: ParseInput,
) => {
  let inpt = input;
  let parserResult = "";
  for (const parser of parsers) {
    const [result, remainder] = parser(inpt);
    if (!result.ok) return [result, remainder];
    parserResult = parserResult.concat(result.value);
    inpt = remainder;
  }

  return ok(parserResult, inpt);
};

Deno.test("pipeTest", () => {
  const alabamaParser = pipe(
    or(char("a"), char("b")),
    char("l"),
    char("a"),
    char("b"),
    char("a"),
    char("m"),
    char("a"),
  );

  assertEquals(alabamaParser("blabama"), ok("blabama", ""));
  assertEquals(alabamaParser("alabama"), ok("alabama", ""));
});
