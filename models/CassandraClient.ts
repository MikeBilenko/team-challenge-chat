import cassandra from "cassandra-driver";
const Client = cassandra.Client;
const Mapper = cassandra.mapping.Mapper;

const CassandraClient = new Client({ contactPoints: ["cassandra-container"], localDataCenter: "datacenter1", credentials: { username: 'cassandra', password: 'cassandra' } });

async function connectWithRetry(retries: number, delay: number) {
    for (let i = 0; i < retries; i++) {
        try {
            await CassandraClient.connect();
            console.log('Connected to Cassandra database');
            return; // Exit if connected successfully
        } catch (error: any) {
            console.error(`Connection attempt ${i + 1} failed: ${error.message}`);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
            } else {
                console.error('Max retries reached. Could not connect to the database.');
                throw error; // Re-throw the error after max retries
            }
        }
    }
}

export { CassandraClient, connectWithRetry };