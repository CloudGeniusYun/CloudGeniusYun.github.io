document.addEventListener('DOMContentLoaded', () => {
    const ipAddressElement = document.getElementById('ip-address');
    const locationElement = document.getElementById('location');
    const ispElement = document.getElementById('isp');
    const cityElement = document.getElementById('city');
    const regionElement = document.getElementById('region');
    const countryElement = document.getElementById('country');
    const timezoneElement = document.getElementById('timezone');

    // Function to fetch IP information
    async function getIpInfo() {
        try {
            const response = await fetch('https://ip-api.com/json/?lang=zh-CN');
            const data = await response.json();

            if (data.status === 'success') {
                ipAddressElement.textContent = data.query || 'N/A';
                locationElement.textContent = `${data.lat}, ${data.lon}` || 'N/A';
                ispElement.textContent = data.isp || 'N/A';
                cityElement.textContent = data.city || 'N/A';
                regionElement.textContent = data.regionName || 'N/A';
                countryElement.textContent = data.country || 'N/A';
                timezoneElement.textContent = data.timezone || 'N/A';
            } else {
                throw new Error(data.message || '无法获取 IP 信息');
            }
        } catch (error) {
            console.error('获取 IP 信息失败:', error);
            ipAddressElement.textContent = '获取失败';
            locationElement.textContent = '获取失败';
            ispElement.textContent = '获取失败';
            cityElement.textContent = '获取失败';
            regionElement.textContent = '获取失败';
            countryElement.textContent = '获取失败';
            timezoneElement.textContent = '获取失败';
        }
    }

    getIpInfo();
});