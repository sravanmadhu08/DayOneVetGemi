import React from 'react';
import { BulkImport } from '@/src/components/BulkImport';
import { motion } from 'framer-motion';
import { FileDown, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function BulkImportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <h1 className="text-4xl font-extrabold tracking-tight">Question Library Management</h1>
        <p className="text-muted-foreground text-lg italic leading-relaxed">
          Scale your custom assessment library by importing cases from medical documents.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <BulkImport />
        </div>
        
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Instructions</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                   <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">1</div>
                   <p className="text-xs text-muted-foreground leading-relaxed">Prepare your .docx file with medical questions, options, and explanations.</p>
                </div>
                <div className="flex gap-3">
                   <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">2</div>
                   <p className="text-xs text-muted-foreground leading-relaxed">Upload the file. Gemini will parse the text and structure it into clinical cases.</p>
                </div>
                <div className="flex gap-3">
                   <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">3</div>
                   <p className="text-xs text-muted-foreground leading-relaxed">Imported questions will appear in your "Custom" filter during quiz generation.</p>
                </div>
              </div>
              
              <div className="pt-6 border-t mt-4">
                <h4 className="text-xs font-bold mb-3 flex items-center gap-2">
                  <FileDown className="h-3 w-3" /> Sample Format
                </h4>
                <div className="p-3 bg-background rounded-lg border text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
                  {`Q: What is the primary...
A) Option A
B) Option B
C) Option C
D) Option D
Correct: A
Exp: Explanations go here.`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
