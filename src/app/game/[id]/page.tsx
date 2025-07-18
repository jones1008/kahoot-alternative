'use client'

import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Choice, Game, Participant, Question, supabase } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const onRegisterCompleted = (participant: Participant) => {
    setParticipant(participant)
    getGame()
  }

  const stateRef = useRef<Participant | null>()

  const [participant, setParticipant] = useState<Participant | null>()

  stateRef.current = participant

  const [currentScreen, setCurrentScreen] = useState(Screens.lobby)

  const [questions, setQuestions] = useState<Question[]>()

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [shownChoiceIndex, setShownChoiceIndex] = useState<number | null>(null);

  const getGame = async () => {
    const { data: game } = await supabase
      .from('games')
      .select()
      .eq('id', gameId)
      .single()
    if (!game) return
    setCurrentScreen(game.phase as Screens)
    if (game.phase == Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setShownChoiceIndex(game.shown_choice_index)
      setIsAnswerRevealed(game.is_answer_revealed)
    }

    getQuestions(game.quiz_set_id)
  }

  const getQuestions = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, choices(*)`)
      .eq('quiz_set_id', quizSetId)
      .order('order', { ascending: true })
    if (error) {
      getQuestions(quizSetId)
      return
    }
    setQuestions(data)
  }

  useEffect(() => {
    const gameChannel = supabase
        .channel('game_participant')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            if (!stateRef.current) return

            // start the quiz game
            const game = payload.new as Game

            if (game.phase == 'result') {
              setCurrentScreen(Screens.results)
            } else {
              setCurrentScreen(Screens.quiz)
              setCurrentQuestionSequence(game.current_question_sequence)
              setShownChoiceIndex(game.shown_choice_index)
              setIsAnswerRevealed(game.is_answer_revealed)
            }
          }
        )
        .subscribe()

    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [supabase, gameId])

  return (
    <main className="bg-green-500 h-svh">
      {currentScreen == Screens.lobby && (
        <Lobby
          onRegisterCompleted={onRegisterCompleted}
          gameId={gameId}
        ></Lobby>
      )}
      {currentScreen == Screens.quiz && questions && (
        <Quiz
          question={questions![currentQuestionSequence]}
          participantId={participant!.id}
          isAnswerRevealed={isAnswerRevealed}
          shownChoiceIndex={shownChoiceIndex}
        ></Quiz>
      )}
      {currentScreen == Screens.results && (
        <Results participant={participant!}></Results>
      )}
    </main>
  )
}

function Results({ participant }: { participant: Participant }) {
  return (
    <div className="flex justify-center items-center min-h-screen text-center">
      <div className="p-8 bg-black text-white rounded-lg">
        <p>Danke fürs Spielen, {participant.nickname}!</p>
      </div>
    </div>
  )
}
