import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const readmeContent = `
<h1>Welcome to your Lovable project</h1>

<h2>Project info</h2>
<p><strong>URL</strong>: <a href="https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID" target="_blank" rel="noopener noreferrer">https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID</a></p>

<h2>How can I edit this code?</h2>
<p>There are several ways of editing your application.</p>

<h3>Use Lovable</h3>
<p>Simply visit the <a href="https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID" target="_blank" rel="noopener noreferrer">Lovable Project</a> and start prompting.</p>
<p>Changes made via Lovable will be committed automatically to this repo.</p>

<h3>Use your preferred IDE</h3>
<p>If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.</p>
<p>The only requirement is having Node.js &amp; npm installed - <a href="https://github.com/nvm-sh/nvm#installing-and-updating" target="_blank" rel="noopener noreferrer">install with nvm</a></p>

<p>Follow these steps:</p>
<pre><code># Step 1: Clone the repository using the project's Git URL.
git clone &lt;YOUR_GIT_URL&gt;

# Step 2: Navigate to the project directory.
cd &lt;YOUR_PROJECT_NAME&gt;

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev</code></pre>

<h3>Edit a file directly in GitHub</h3>
<ul>
  <li>Navigate to the desired file(s).</li>
  <li>Click the "Edit" button (pencil icon) at the top right of the file view.</li>
  <li>Make your changes and commit the changes.</li>
</ul>

<h3>Use GitHub Codespaces</h3>
<ul>
  <li>Navigate to the main page of your repository.</li>
  <li>Click on the "Code" button (green button) near the top right.</li>
  <li>Select the "Codespaces" tab.</li>
  <li>Click on "New codespace" to launch a new Codespace environment.</li>
  <li>Edit files directly within the Codespace and commit and push your changes once you're done.</li>
</ul>

<h2>What technologies are used for this project?</h2>
<p>This project is built with:</p>
<ul>
  <li>Vite</li>
  <li>TypeScript</li>
  <li>React</li>
  <li>shadcn-ui</li>
  <li>Tailwind CSS</li>
</ul>

<h2>How can I deploy this project?</h2>
<p>Simply open <a href="https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID" target="_blank" rel="noopener noreferrer">Lovable</a> and click on Share → Publish.</p>

<h2>Can I connect a custom domain to my Lovable project?</h2>
<p>Yes, you can!</p>
<p>To connect a domain, navigate to Project → Settings → Domains and click Connect Domain.</p>
<p>Read more here: <a href="https://docs.lovable.dev/features/custom-domain#custom-domain" target="_blank" rel="noopener noreferrer">Setting up a custom domain</a></p>
`;

const Settings = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <PageBreadcrumb items={[{ label: "Settings" }]} />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Project documentation and configuration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              README.md
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:mt-0
                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3
                [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2
                [&_p]:text-muted-foreground [&_p]:mb-3 [&_p]:leading-relaxed
                [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:text-muted-foreground
                [&_li]:mb-1
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:mb-4
                [&_code]:text-sm [&_code]:text-foreground
                [&_strong]:text-foreground [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: readmeContent }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
