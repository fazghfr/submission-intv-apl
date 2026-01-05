import { createServer } from 'node:http';

let provinsiMap = new Map();

async function bootstrap() {
    provinsiMap = await populateAddress();
    console.log(`Address loaded. Map size: ${provinsiMap.size}`);

    const server = createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/') {
            res.statusCode = 200;
            res.end(JSON.stringify({ message: 'server is running' }));
            return;
        }

        if (req.url === '/cekAlamat' && req.method === 'POST') {
            const body = [];

            req.on('data', chunk => {
                body.push(chunk);
            });

            req.on('end', async () => {
                try {
                    const bodyString = Buffer.concat(body).toString();
                    console.log('Raw body:', bodyString);

                    const { provinsi, kabkota } = JSON.parse(bodyString);
                    console.log(`Parsed inputs - Provinsi: ${provinsi}, Kabkota: ${kabkota}`);

                    if (!provinsi || !kabkota) {
                        console.log('Missing provinsi/kabkota in body');
                        res.statusCode = 400;
                        res.end(JSON.stringify({ message: 'Invalid request body' }));
                        return;
                    }

                    const provinsiLower = provinsi.toLowerCase();
                    const kabkotaLower = kabkota.toLowerCase();

                    const provinsiId = provinsiMap.get(provinsiLower);
                    console.log(`Provinsi ID lookup for '${provinsiLower}':`, provinsiId);

                    if (!provinsiId) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({
                            code: 0,
                            message: 'Tidak Sesuai, provinsi tidak ditemukan'
                        }));
                        return;
                    }

                    const url = `https://alamat.thecloudalert.com/api/kabkota/get/?d_provinsi_id=${provinsiId}`;
                    console.log(`Fetching kabupaten from: ${url}`);
                    const response = await fetch(url);
                    const kabData = await response.json();
                    console.log('Kabupaten API response:', JSON.stringify(kabData).substring(0, 200) + '...');

                    // Debugging structure if it's not an array
                    let kabList = kabData;
                    if (!Array.isArray(kabData)) {
                        console.log('kabData is not an array, checking .result property...');
                        if (kabData.result && Array.isArray(kabData.result)) {
                            kabList = kabData.result;
                        } else {
                            console.log('Unexpected kabData structure:', kabData);
                        }
                    }

                    const foundKab = kabList.find(
                        item => item.text.toLowerCase() === kabkotaLower
                    );
                    console.log('Found Kabupaten:', foundKab);

                    if (!foundKab) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({
                            code: 0,
                            message: 'Tidak Sesuai, kabupaten tidak ditemukan'
                        }));
                        return;
                    }

                    res.statusCode = 200;
                    res.end(JSON.stringify({ code: 1, message: 'Sesuai' }));
                } catch (err) {
                    console.error('Error in request handler:', err);
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: 'Invalid request body', error: err.message }));
                }
            });

            return;
        }

        console.log('Route not found');
        res.statusCode = 404;
        res.end(JSON.stringify({ message: 'Route not found' }));
    });

    server.listen(3080, () => {
        console.log('Server running at http://localhost:3080/');
    });
}

bootstrap();

async function populateAddress() {
    console.log('Populating address...');
    const provinsiMap = new Map();

    try {
        const response = await fetch('https://alamat.thecloudalert.com/api/provinsi/get/');
        const data = await response.json();
        console.log('Provinsi API response status:', response.status);

        const result = data.result;
        if (Array.isArray(result)) {
            result.forEach(item => {
                provinsiMap.set(item.text.toLowerCase(), item.id);
            });
            console.log('Provinsi map populated with ' + result.length + ' entries.');
        } else {
            console.error('Unexpected structure for provinsi data:', data);
        }

    } catch (e) {
        console.error('Error populating address:', e);
    }

    return provinsiMap;
}