import {Answer, GameResult, Participant, Question, supabase} from '@/types/types'
import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionIndex: questionIndex,
  questionsCount: questionsCount,
  gameId,
  participants,
  shownChoiceIndex
}: {
  question: Question
  questionIndex: number
  questionsCount: number
  gameId: string
  participants: Participant[]
  shownChoiceIndex: number | null
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [answers, setAnswers] = useState<Answer[]>([])

  const [gameResults, setGameResults] = useState<GameResult[]>([])

  const answerStateRef = useRef<Answer[]>()

  answerStateRef.current = answers

  const getNextQuestion = async () => {
    var updateData
    if (questionIndex + 1 >= questionsCount) {
      updateData = { phase: 'result' }
    } else {
      updateData = {
        current_question_sequence: questionIndex + 1,
        shown_choice_index: null,
        is_answer_revealed: false,
      }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  const showNextChoice = async () => {
    const index = shownChoiceIndex === null ? 0 : shownChoiceIndex + 1;
    const { data, error } = await supabase
      .from('games')
      .update({
        shown_choice_index: index,
      })
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await supabase
      .from('games')
      .update({
        is_answer_revealed: true,
      })
      .eq('id', gameId)
  }

  useEffect(() => {
    setIsAnswerRevealed(false)
    setAnswers([])

    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          setAnswers((currentAnswers) => {
            return [...currentAnswers, payload.new as Answer]
          })

          if (
            (answerStateRef.current?.length ?? 0) + 1 ===
            participants.length
          ) {
            onTimeUp()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [question.id])

  useEffect(() => {
    setGameResults([]);
    if (isAnswerRevealed) {
      const getResults = async () => {
        const { data, error } = await supabase
          .from('game_results')
          .select()
          .eq('game_id', gameId)
          .order('total_score', { ascending: false })
        if (error) {
          return alert(error.message)
        }

        setGameResults(data)
      }

      getResults();
    }
  }, [isAnswerRevealed, gameId]);

  return (
    <div className="min-h-screen flex flex-col items-stretch bg-slate-900 relative">
      <div className="absolute right-4 top-4">
        {isAnswerRevealed && (
          <button
            className="p-2 bg-white text-black rounded hover:bg-gray-200"
            onClick={getNextQuestion}
          >
            Nächste Frage
          </button>
        )}
      </div>

      <div className="text-center">
        <h2 className="pb-4 text-3xl bg-white font-bold mx-24 my-12 p-4 rounded inline-block">
          {question.body}
        </h2>
      </div>

      {(shownChoiceIndex === null || shownChoiceIndex < question.choices.length -1) && (
        <div className="text-center">
          <button
            className="p-2 bg-white text-black rounded hover:bg-gray-200"
            onClick={showNextChoice}
          >
            Nächste Antwort
          </button>
        </div>
      )}

      <div className="relative">
        {(shownChoiceIndex && shownChoiceIndex >= question.choices.length -1) && (
          <div>
            <div className="text-5xl text-white left-6 absolute">
              <CountdownCircleTimer
                onComplete={() => {
                  onTimeUp()
                }}
                isPlaying
                duration={20}
                colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                colorsTime={[7, 5, 2, 0]}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            </div>
            <div className="text-center text-white right-6 absolute">
              <div className="text-6xl pb-4">{answers.length}</div>
              <div className="text-3xl">Antworten</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow text-white px-8">
        {isAnswerRevealed && (
          <div className="flex flex-row gap-10 justify-center items-center">
            <div className="flex justify-center">
              {question.choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className="mx-2 h-48 w-24 flex flex-col items-stretch justify-end"
                >
                  <div className="flex-grow relative">
                    <div
                      style={{
                        height: `${
                          (answers.filter(
                              (answer) => answer.choice_id === choice.id
                            ).length *
                            100) /
                          (answers.length || 1)
                        }%`,
                      }}
                      className={`absolute bottom-0 left-0 right-0 mb-1 rounded-t ${
                        index === 0
                          ? 'bg-red-500'
                          : index === 1
                            ? 'bg-blue-500'
                            : index === 2
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                      }`}
                    ></div>
                  </div>
                  <div
                    className={`mt-1 text-white text-lg text-center py-2 rounded-b ${
                      index === 0
                        ? 'bg-red-500'
                        : index === 1
                          ? 'bg-blue-500'
                          : index === 2
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                    }`}
                  >
                    {
                      answers.filter((answer) => answer.choice_id === choice.id)
                        .length
                    }
                  </div>
                </div>
              ))}
            </div>
            {gameResults && (
              <div className="mt-4">
                <div className="text-3xl text-center">Bestenliste:</div>
                {gameResults.map((gameResult, index) => (
                  <div key={gameResult.participant_id} className="flex justify-center items-stretch">
                    {index <= 7 && (
                      <div
                        className={`flex justify-between items-center bg-white py-2 px-4 rounded my-4 max-w-2xl w-full text-black ${
                          index < 3 ? 'shadow-xl font-bold' : ''
                        }`}
                      >
                        <div className={`pr-4 ${index < 3 ? 'text-3xl' : 'text-l'}`}>
                          {index + 1}
                        </div>
                        <div
                          className={`flex-grow font-bold ${
                            index < 3 ? 'text-5xl' : 'text-2xl'
                          }`}
                        >
                          {gameResult.nickname}
                        </div>
                        <div className="pl-2">
                      <span className="text-3xl font-bold">
                        {gameResult.total_score}
                      </span>&nbsp;
                          <span>Punkte</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {shownChoiceIndex !== null && (
        <div className="flex justify-between flex-wrap p-4">
          {question.choices.map((choice, index) => (
            <div key={choice.id} className="w-1/2 p-1">
              {index <= shownChoiceIndex && (
                <div
                  className={`px-4 py-6 w-full text-2xl rounded font-bold text-white flex justify-between
                    ${
                      index === 0
                        ? 'bg-red-500'
                        : index === 1
                          ? 'bg-blue-500'
                          : index === 2
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                    }
                    ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
                   `}
                >
                  <div>{choice.body}</div>
                  {isAnswerRevealed && (
                    <div>
                      {choice.is_correct && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      )}
                      {!choice.is_correct && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
