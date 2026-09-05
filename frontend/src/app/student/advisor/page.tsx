"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { RecommendedSubjectDto } from "@/lib/types";
import { Bot, Sparkles, BookOpen, ChevronRight, Loader2, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function StudentAiAdvisorPage() {
  const [recommendations, setRecommendations] = useState<RecommendedSubjectDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setHasRequested(true);
      const res = await api.get<RecommendedSubjectDto[]>("/aidadvisor/recommendations");
      setRecommendations(res.data || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            AI Course Advisor <Sparkles className="w-4 h-4 text-violet-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Get personalized subject recommendations based on your performance and interests.
          </p>
        </div>
      </div>

      {!hasRequested ? (
        <div className="p-10 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white text-center shadow-xl shadow-violet-900/20 max-w-3xl mx-auto border border-violet-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <BrainCircuit className="w-16 h-16 mx-auto mb-6 text-violet-200" />
          <h2 className="text-2xl md:text-3xl font-black mb-3">Not sure what to study next?</h2>
          <p className="text-violet-100 mb-8 max-w-xl mx-auto leading-relaxed">
            Our AI Course Advisor analyzes your current academic performance, historical trends, and potential career paths to suggest the optimal subjects for your next semester.
          </p>
          <Button 
            onClick={fetchRecommendations}
            className="bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800 font-bold px-8 py-3 rounded-full shadow-lg shadow-violet-900/20 border-none text-base cursor-pointer transform hover:scale-105 transition-all"
          >
            Generate My Plan
          </Button>
        </div>
      ) : loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-400 rounded-full blur-xl animate-pulse opacity-50" />
            <Loader2 className="w-12 h-12 text-violet-600 dark:text-violet-400 animate-spin relative z-10" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            Analyzing your academic profile and generating recommendations...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Personalized Plan</h2>
            <Button variant="outline" size="sm" onClick={fetchRecommendations} className="cursor-pointer">
              Refresh Recommendations
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No recommendations could be generated at this time.
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div 
                  key={rec.subjectId} 
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700/50 hover:shadow-lg hover:shadow-violet-900/5 transition-all group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                      {rec.code}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {rec.name}
                  </h3>
                  
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" /> AI Rationale
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                  
                  <button className="mt-5 w-full flex items-center justify-center space-x-2 py-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors cursor-pointer">
                    <span>View Syllabus</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
