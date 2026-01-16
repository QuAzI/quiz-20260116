import { useEffect, useMemo, useState } from "react";

type QuestionOption = {
  text: string;
  right?: boolean;
};

type Question = {
  question: string;
  options: QuestionOption[];
};

type LoadState = "loading" | "ready" | "error";

const QUESTION_SOURCES = ["/files/questions.json", "/questions.json"];
const BACKGROUND_SOURCES = ["/files/backgrounds/index.json", "/backgrounds/index.json"];

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const loadJsonWithFallback = async <T,>(sources: string[]): Promise<T> => {
  for (const source of sources) {
    const response = await fetch(source, { cache: "no-store" });
    if (response.ok) {
      return response.json() as Promise<T>;
    }
  }
  throw new Error("Unable to load JSON");
};

const normalizeQuestions = (raw: Question[]): Question[] =>
  raw
    .map((entry) => ({
      question: entry.question?.trim() ?? "",
      options:
        entry.options?.map((option) => ({
          text: option.text?.trim() ?? "",
          right: option.right
        })) ?? []
    }))
    .filter((entry) => entry.question && entry.options.length === 4);

const createBackgroundMap = (count: number, backgrounds: string[]): (string | null)[] => {
  if (backgrounds.length === 0) {
    return new Array(count).fill(null);
  }
  return Array.from({ length: count }, () => {
    const pick = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    return pick;
  });
};

const buildBackgroundUrl = (path: string) => {
  if (path.startsWith("/")) {
    return path;
  }
  return `/backgrounds/${path}`;
};

const App = () => {
  const [state, setState] = useState<LoadState>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [backgroundMap, setBackgroundMap] = useState<(string | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [rawQuestions, backgroundList] = await Promise.all([
          loadJsonWithFallback<Question[]>(QUESTION_SOURCES),
          loadJsonWithFallback<string[]>(BACKGROUND_SOURCES).catch(() => [])
        ]);
        const normalized = normalizeQuestions(rawQuestions);
        const shuffled = shuffle(normalized);
        setQuestions(shuffled);
        setBackgrounds(backgroundList);
        setBackgroundMap(createBackgroundMap(shuffled.length, backgroundList));
        setState(shuffled.length ? "ready" : "error");
        if (!shuffled.length) {
          setErrorMessage("Нет подходящих вопросов в файле.");
        }
      } catch (error) {
        setState("error");
        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить вопросы.");
      }
    };
    load();
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentBackground = backgroundMap[currentIndex];
  const total = questions.length;
  const answered = selectedIndex !== null;
  const isFinished = state === "ready" && currentIndex >= total;

  const backgroundStyle = useMemo(() => {
    if (!currentBackground) {
      return undefined;
    }
    return {
      backgroundImage: `url("${buildBackgroundUrl(currentBackground)}")`
    } as const;
  }, [currentBackground]);

  const handleOptionClick = (index: number) => {
    if (answered || !currentQuestion) {
      return;
    }
    setSelectedIndex(index);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setCurrentIndex(total);
      setSelectedIndex(null);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
  };

  const handleRestart = () => {
    const shuffled = shuffle(questions);
    setQuestions(shuffled);
    setBackgroundMap(createBackgroundMap(shuffled.length, backgrounds));
    setCurrentIndex(0);
    setSelectedIndex(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-far-100">
      <div
        className="relative min-h-screen bg-cover bg-center"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
        <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
          <header className="flex items-center justify-between border border-far-500/60 bg-slate-900/70 px-4 py-3 text-sm uppercase tracking-[0.3em] shadow-far">
            <span>FAR QUIZ</span>
            <span>СЕССИЯ: {total || "—"}</span>
          </header>

          {state === "loading" && (
            <div className="rounded border border-far-500/40 bg-slate-900/60 px-6 py-8 text-center shadow-far">
              Загрузка вопросов...
            </div>
          )}

          {state === "error" && (
            <div className="rounded border border-red-400/60 bg-red-950/40 px-6 py-8 text-center text-red-100 shadow-far">
              {errorMessage || "Ошибка загрузки."}
            </div>
          )}

          {state === "ready" && !isFinished && currentQuestion && (
            <main className="rounded border border-far-500/60 bg-slate-900/70 p-6 shadow-far">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.2em] text-far-200">
                <span>Вопрос {currentIndex + 1} / {total}</span>
                <span>{answered ? "ОТВЕТ ПРИНЯТ" : "ВЫБЕРИТЕ ВАРИАНТ"}</span>
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-far-50">
                {currentQuestion.question}
              </h1>

              <div className="mt-6 grid gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const isCorrect = Boolean(option.right);
                  const showCorrect = answered && isCorrect;
                  const showWrong = answered && isSelected && !isCorrect;

                  const base =
                    "w-full rounded border px-4 py-3 text-left text-base transition";
                  const idle =
                    "border-far-500/40 bg-slate-950/60 hover:border-far-500 hover:bg-slate-950/80";
                  const correct =
                    "border-far-400 bg-far-900/70 text-far-50 shadow-far";
                  const wrong =
                    "border-red-400 bg-red-950/70 text-red-100";

                  let className = `${base} ${idle}`;
                  if (showCorrect) {
                    className = `${base} ${correct}`;
                  } else if (showWrong) {
                    className = `${base} ${wrong}`;
                  }

                  return (
                    <button
                      key={`${option.text}-${index}`}
                      type="button"
                      className={className}
                      onClick={() => handleOptionClick(index)}
                      disabled={answered}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded border border-far-400 bg-far-900/70 px-5 py-2 text-sm uppercase tracking-[0.3em] text-far-50 shadow-far transition hover:bg-far-800/80"
                  >
                    Следующий вопрос
                  </button>
                </div>
              )}
            </main>
          )}

          {state === "ready" && isFinished && (
            <main className="rounded border border-far-500/60 bg-slate-900/70 p-8 text-center shadow-far">
              <h1 className="text-2xl font-semibold text-far-50">Викторина завершена</h1>
              <p className="mt-3 text-far-200">
                Все вопросы в этой сессии пройдены. Можно начать заново.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded border border-far-400 bg-far-900/70 px-6 py-3 text-sm uppercase tracking-[0.3em] text-far-50 shadow-far transition hover:bg-far-800/80"
                >
                  Новая сессия
                </button>
              </div>
            </main>
          )}

          <footer className="text-center text-xs uppercase tracking-[0.35em] text-far-300">
            FAR STYLE UI · QUESTIONS FROM FILES
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
