'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { AUTHORIZED_CONTENT } from '@/lib/mock-data';
import { recommendContent, ContentRecommendationOutput } from '@/ai/flows/content-recommendation-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Bookmark, ExternalLink, RefreshCw, BrainCircuit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function CuratorPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<ContentRecommendationOutput['recommendations']>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await recommendContent({
        userPreferences: user.preferences,
        availableContent: AUTHORIZED_CONTENT.map(({ id, title, description, category, tags }) => ({
          id, title, description, category, tags
        }))
      });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Recommendation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-primary p-8 rounded-3xl text-white shadow-2xl overflow-hidden relative">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <BrainCircuit className="w-3 h-3" />
            GenAI Intelligence
          </div>
          <h1 className="text-4xl font-bold tracking-tight">AI Content Curator</h1>
          <p className="text-white/80 max-w-xl text-lg">
            Analyzing your clearance level and professional preferences to suggest the most relevant high-security assets.
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-full lg:w-auto">
          <Button 
            size="lg" 
            onClick={fetchRecommendations} 
            disabled={isLoading}
            className="w-full lg:w-auto bg-white text-primary hover:bg-white/90 font-bold h-14 px-8 rounded-2xl shadow-xl shadow-black/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            Generate New Briefing
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
      </div>

      <div className="space-y-6">
        {recommendations.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <h2 className="text-2xl font-bold">Suggested for You</h2>
              <Button variant="ghost" onClick={fetchRecommendations} disabled={isLoading} size="sm" className="w-full sm:w-auto text-primary hover:bg-primary/10">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Suggestions
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="border-2 hover:border-primary/30 transition-all group overflow-hidden flex flex-col">
                  <CardHeader className="bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <CardTitle className="text-xl">{rec.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{rec.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 flex-1 space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Reason for Suggestion</p>
                      <p className="text-sm italic text-muted-foreground leading-relaxed">
                        &quot;{rec.reason}&quot;
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex gap-2">
                    <Button className="flex-1 bg-primary gap-2" asChild>
                      <Link href={`/dashboard/content/${rec.id}`}>
                        View Brief
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-secondary/5 rounded-3xl border-2 border-dashed px-6">
            <div className="p-4 rounded-full bg-secondary/20 text-primary">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="max-w-sm space-y-2">
              <h3 className="text-xl font-bold">Ready to curate?</h3>
              <p className="text-muted-foreground">
                Click the button above to let the CONEX AI analyze available classified content based on your profile interests.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-muted/30 p-8 rounded-3xl border space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          How it works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="font-bold text-sm">Clearance Check</p>
            <p className="text-xs text-muted-foreground">The AI first filters all content based on your current security role ({user?.role}) to ensure zero unauthorized access.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm">Interest Mapping</p>
            <p className="text-xs text-muted-foreground">It then maps your preferences from your profile to metadata across the private resource library.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm">Relevance Scoring</p>
            <p className="text-xs text-muted-foreground">The system generates a relevance score and provides human-readable context for why you should consume each item.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
