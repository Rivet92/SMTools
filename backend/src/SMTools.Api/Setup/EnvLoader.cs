namespace SMTools.Api.Setup;

public static class EnvLoader
{
    public static void TryLoadFromProjectRoot()
    {
        var envFile = FindEnvFile(Directory.GetCurrentDirectory());
        if (envFile is not null)
        {
            LoadEnvFile(envFile);
        }
    }

    private static string? FindEnvFile(string startDirectory)
    {
        var directory = new DirectoryInfo(startDirectory);
        while (directory is not null)
        {
            var envPath = Path.Combine(directory.FullName, ".env");
            if (File.Exists(envPath))
            {
                return envPath;
            }

            directory = directory.Parent;
        }

        return null;
    }

    private static void LoadEnvFile(string path)
    {
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            if (line[0] == '#')
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=', StringComparison.Ordinal);
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();

            if (value.Length >= 2 &&
                ((value[0] == '"' && value[^1] == '"') ||
                 (value[0] == '\'' && value[^1] == '\'')))
            {
                value = value[1..^1];
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    public static void EnsureConnectionString()
    {
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")))
            return;

        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
        var database = Environment.GetEnvironmentVariable("POSTGRES_DB");
        var username = Environment.GetEnvironmentVariable("POSTGRES_USER");
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");

        if (!string.IsNullOrEmpty(database) && !string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
        {
            var connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password}";
            Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", connectionString);
        }
    }
}
