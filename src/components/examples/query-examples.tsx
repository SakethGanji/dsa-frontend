import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { usePaginatedDatasets } from '@/hooks/use-datasets-query';
import { useLogin } from '@/hooks/use-auth-query';
import { useExploreDataset, explorationOperations, createExploreOptions } from '@/hooks/use-exploration-query';

/**
 * Example component showing how to use authentication hooks
 */
export function LoginExample() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const loginMutation = useLogin({
    onSuccess: () => {
      // Reset form and redirect
      setUsername('');
      setPassword('');
      // In a real app, you would redirect to the dashboard here
      console.log('Login successful!');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // In a real app, you would show an error message here
    }
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username,
      password,
      grant_type: 'password',
    });
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login Example</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
          
          {loginMutation.isError && (
            <p className="text-destructive text-sm mt-2">
              {loginMutation.error.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Example component showing how to use dataset hooks
 */
export function DatasetListExample() {
  const {
    data,
    isLoading,
    isError,
    error,
    pagination,
    filtering,
  } = usePaginatedDatasets({ limit: 5 });
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get('search') as string;
    filtering.setSearchTerm(searchTerm);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Datasets List Example</CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            name="search"
            placeholder="Search datasets..."
            defaultValue={filtering.params.name || ''}
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <p>Loading datasets...</p>
        ) : isError ? (
          <p className="text-destructive">Error: {error.message}</p>
        ) : data?.items.length === 0 ? (
          <p>No datasets found.</p>
        ) : (
          <div className="space-y-4">
            {data?.items.map((dataset) => (
              <div key={dataset.id} className="p-4 border rounded-md">
                <h3 className="font-medium">{dataset.name}</h3>
                <p className="text-sm text-muted-foreground">{dataset.description}</p>
                <div className="flex gap-2 mt-2">
                  {dataset.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-muted rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {data && `Showing ${pagination.currentPage} of ${pagination.total} pages`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.goToPrevPage()}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.goToNextPage()}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Example component showing how to use exploration hooks
 */
export function DatasetExplorationExample() {
  const [datasetId, setDatasetId] = useState<number>(1); // Example dataset ID
  const [versionId, setVersionId] = useState<number>(1); // Example version ID
  const [runProfiling, setRunProfiling] = useState(false);
  
  const exploreMutation = useExploreDataset({
    onSuccess: (data) => {
      console.log('Exploration results:', data);
      // In a real app, you would update the UI with the results
    },
    onError: (error) => {
      console.error('Exploration failed:', error);
    },
  });
  
  const handleExplore = () => {
    // Example operations
    const operations = [
      // Filter rows where 'age' column is greater than 20
      explorationOperations.filterRows('age > 20'),
      
      // Sample 1000 rows randomly
      explorationOperations.sampleRows(1000),
      
      // Sort by 'name' column ascending
      explorationOperations.sortRows(['name']),
    ];
    
    const options = createExploreOptions(operations, {
      run_profiling: runProfiling,
    });
    
    exploreMutation.mutate({
      datasetId,
      versionId,
      options,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Exploration Example</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="datasetId">Dataset ID</Label>
            <Input
              id="datasetId"
              type="number"
              value={datasetId}
              onChange={(e) => setDatasetId(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="versionId">Version ID</Label>
            <Input
              id="versionId"
              type="number"
              value={versionId}
              onChange={(e) => setVersionId(Number(e.target.value))}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="runProfiling" 
            checked={runProfiling}
            onCheckedChange={(checked) => setRunProfiling(!!checked)}
          />
          <Label htmlFor="runProfiling">Run full profiling (may be slow)</Label>
        </div>
        
        <Separator />
        
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            This example will run the following operations:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Filter rows where 'age' &gt; 20</li>
            <li>Sample 1000 rows randomly</li>
            <li>Sort by 'name' column ascending</li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleExplore}
          disabled={exploreMutation.isPending}
          className="w-full"
        >
          {exploreMutation.isPending ? 'Running exploration...' : 'Run Exploration'}
        </Button>
      </CardFooter>
    </Card>
  );
}