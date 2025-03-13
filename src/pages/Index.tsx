
import React from 'react';
import Layout from '@/components/Layout';
import TagMapper from '@/components/TagMapper';

const Index = () => {
  return (
    <Layout>
      <header className="w-full max-w-3xl mx-auto mb-6 text-center">
        <div className="inline-block animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">
            Slack Tag Mapper
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create, manage, and export Slack user tag mappings with elegance and simplicity.
          </p>
        </div>
      </header>
      <main className="animation-delay-200 opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <TagMapper />
      </main>
    </Layout>
  );
};

export default Index;
