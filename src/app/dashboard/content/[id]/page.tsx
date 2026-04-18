
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AUTHORIZED_CONTENT, ContentItem } from '@/lib/mock-data';
import { useAuth } from '@/components/auth-context';
import { summarizeDocument } from '@/ai/flows/document-summarization-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  Sparkles, 
  Loader2, 
  Download, 
  Printer, 
  Share2,
  ShieldAlert
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function ContentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [content, setContent] = useState<ContentItem | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const found = AUTHORIZED_CONTENT.find(c => c.id === id);
    if (found) {
      // Basic RBAC check
      if (found.requiredRole && user?.role !== 'ADMIN' && found.requiredRole !== user?.role) {
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "Your clearance level is insufficient for this resource."
        });
        router.push('/dashboard');
        return;
      }
      setContent(found);
    }
  }, [id, user, router, toast]);

  const handleSummarize = async () => {
    if (!content) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeDocument({ documentText: content.content });
      setSummary(result.summary);
      toast({
        title: "Briefing Extracted",
        description: "AI has successfully generated a concise summary of this classified asset.",
      });
    } catch (error) {
      console.error('Summary failed:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!content) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-secondary/10 border-secondary/20 text-primary">
              {content.category.toUpperCase()}
            </Badge>
            {content.requiredRole && (
              <Badge className="bg-red-600">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {content.requiredRole} ONLY
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon"><Download className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon"><Printer className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon"><Share2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 shadow-sm min-h-[600px] flex flex-col">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Primary Content Body
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <div className="prose prose-red max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {content.content}
                  {"\n\n"}[CONEX GATEWAY ENCRYPTION METADATA ATTACHED]
                  {"\n"}Source Node: INTERNAL-HQ-01
                  {"\n"}Classification: PRIVATE-NETWORK-AUTHORIZED
                  {"\n"}Time Stamp: {new Date().toISOString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-primary/20 shadow-lg bg-secondary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Quick Summary
              </CardTitle>
              <CardDescription>
                Condense this classified asset into key intelligence points.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="p-4 rounded-xl bg-white border-2 border-primary/10 text-sm leading-relaxed text-muted-foreground italic">
                    {summary}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-xs text-muted-foreground">Ready for AI processing</p>
                  <Button 
                    onClick={handleSummarize} 
                    disabled={isSummarizing}
                    className="w-full bg-primary font-bold"
                  >
                    {isSummarizing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Briefing
                  </Button>
                </div>
              )}
            </CardContent>
            {summary && (
              <CardFooter>
                <Button variant="ghost" size="sm" onClick={() => setSummary(null)} className="w-full text-xs hover:text-primary">
                  Clear AI Result
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Asset Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="text-muted-foreground">ID:</div>
                <div className="font-mono text-xs">{content.id}</div>
                <div className="text-muted-foreground">Category:</div>
                <div className="font-semibold">{content.category}</div>
                <div className="text-muted-foreground">Clearance:</div>
                <div><Badge variant="outline" className="text-[10px]">{content.requiredRole || 'Standard'}</Badge></div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs font-bold text-muted-foreground mb-2">TAGS</p>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] uppercase">{tag}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
