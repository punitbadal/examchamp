'use client';

import React, { useState } from 'react';
import ExamInterface from '../../components/ExamInterface';

// Sample exam data with JEE Main style questions
const sampleExamData = {
  title: "JEE Main 2024 (Online) 9th April Evening Shift",
  totalDuration: 180, // 3 hours
  totalMarks: 300,
  sections: [
    {
      name: "MATHEMATICS: SECTION A",
      totalQuestions: 20,
      totalMarks: 100,
      questions: [
        {
          id: "math_1",
          questionNumber: 1,
          questionText: `lim<sub>x→π/2</sub> [∫<sub>x³</sub><sup>(π/2)³</sup> (sin(2t<sup>1/3</sup>) + cos(t<sup>1/3</sup>)) dt] / (x - π/2)² is equal to`,
          questionType: "mcq_single" as const,
          options: [
            "3π²/2",
            "9π²/8", 
            "5π²/9",
            "11π²/10"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Mathematics",
          section: "A"
        },
        {
          id: "math_2",
          questionNumber: 2,
          questionText: `If the system of equations x + y + z = 6, x + 2y + 3z = 14, x + 2y + λz = μ has infinitely many solutions, then λ + μ is equal to`,
          questionType: "mcq_single" as const,
          options: [
            "20",
            "18",
            "16", 
            "14"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Mathematics",
          section: "A"
        },
        {
          id: "math_3",
          questionNumber: 3,
          questionText: `The number of real roots of the equation x⁴ - 4x³ + 12x² - 16x + 16 = 0 is`,
          questionType: "mcq_single" as const,
          options: [
            "0",
            "1",
            "2",
            "4"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Mathematics",
          section: "A"
        }
      ]
    },
    {
      name: "MATHEMATICS: SECTION B",
      totalQuestions: 10,
      totalMarks: 40,
      questions: [
        {
          id: "math_b_1",
          questionNumber: 1,
          questionText: `If ∫<sub>0</sub><sup>1</sup> (x² + 1) dx = a + b√2, where a and b are rational numbers, then a + b equals`,
          questionType: "numerical" as const,
          marks: 4,
          negativeMarks: 0,
          subject: "Mathematics",
          section: "B"
        },
        {
          id: "math_b_2", 
          questionNumber: 2,
          questionText: `The number of 4-digit numbers that can be formed using the digits 1, 2, 3, 4, 5, 6, 7, 8, 9 (repetition allowed) such that the number is divisible by 11 is`,
          questionType: "numerical" as const,
          marks: 4,
          negativeMarks: 0,
          subject: "Mathematics",
          section: "B"
        }
      ]
    },
    {
      name: "PHYSICS: SECTION A",
      totalQuestions: 20,
      totalMarks: 100,
      questions: [
        {
          id: "physics_1",
          questionNumber: 1,
          questionText: `A particle moves in a straight line with velocity v = 3t² - 6t + 2 m/s. The displacement of the particle in the first 2 seconds is`,
          questionType: "mcq_single" as const,
          options: [
            "2 m",
            "4 m",
            "6 m",
            "8 m"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Physics",
          section: "A"
        },
        {
          id: "physics_2",
          questionNumber: 2,
          questionText: `A block of mass 2 kg is placed on a rough inclined plane making an angle of 30° with the horizontal. The coefficient of friction between the block and the plane is 0.5. The acceleration of the block down the plane is (g = 10 m/s²)`,
          questionType: "mcq_single" as const,
          options: [
            "2.5 m/s²",
            "5 m/s²",
            "7.5 m/s²",
            "10 m/s²"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Physics",
          section: "A"
        }
      ]
    },
    {
      name: "PHYSICS: SECTION B",
      totalQuestions: 10,
      totalMarks: 40,
      questions: [
        {
          id: "physics_b_1",
          questionNumber: 1,
          questionText: `A simple pendulum of length 1 m has a bob of mass 100 g. The pendulum is displaced through an angle of 60° and released. The maximum velocity of the bob is (g = 10 m/s²)`,
          questionType: "numerical" as const,
          marks: 4,
          negativeMarks: 0,
          subject: "Physics",
          section: "B"
        }
      ]
    },
    {
      name: "CHEMISTRY: SECTION A",
      totalQuestions: 20,
      totalMarks: 100,
      questions: [
        {
          id: "chemistry_1",
          questionNumber: 1,
          questionText: `The IUPAC name of CH₃-CH=CH-CHO is`,
          questionType: "mcq_single" as const,
          options: [
            "But-2-enal",
            "But-2-en-1-al",
            "2-Butenal",
            "2-Buten-1-al"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Chemistry",
          section: "A"
        },
        {
          id: "chemistry_2",
          questionNumber: 2,
          questionText: `The number of σ bonds in benzene (C₆H₆) is`,
          questionType: "mcq_single" as const,
          options: [
            "6",
            "9",
            "12",
            "15"
          ],
          marks: 4,
          negativeMarks: 1,
          subject: "Chemistry",
          section: "A"
        }
      ]
    },
    {
      name: "CHEMISTRY: SECTION B",
      totalQuestions: 10,
      totalMarks: 40,
      questions: [
        {
          id: "chemistry_b_1",
          questionNumber: 1,
          questionText: `The number of stereoisomers possible for 2,3-dibromobutane is`,
          questionType: "numerical" as const,
          marks: 4,
          negativeMarks: 0,
          subject: "Chemistry",
          section: "B"
        }
      ]
    }
  ]
};

export default function ExamPage() {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    console.log('Exam submitted with answers:', answers);
    setIsSubmitted(true);
    // Here you would typically send the answers to your backend
    alert('Exam submitted successfully!');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your exam has been successfully submitted. You will receive your results shortly.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExamInterface
      examData={sampleExamData}
      onAnswerChange={handleAnswerChange}
      onSubmit={handleSubmit}
    />
  );
} 