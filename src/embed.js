const { execSync } = require('child_process');
const path = require('path');

class EmbedSources {
    constructor(sources = [], tracks = [], t = 0, server = 0) {
        this.sources = sources;
        this.tracks = tracks;
        this.t = t;
        this.server = server;
    }
}

class Source {
    constructor(file, sourceType) {
        this.file = file;
        this.type = sourceType;
    }
}

class Track {
    constructor(file, label, kind, isDefault = false) {
        this.file = file;
        this.label = label;
        this.kind = kind;
        if (isDefault) {
            this.default = isDefault;
        }
    }
}

const handleEmbed = (embedUrl, referrer) => {
    try {
        // For Vercel deployment, we need to handle the path differently
        const rabbitPath = process.env.NODE_ENV === 'production' 
            ? path.join('/var/task', 'rabbit.js')
            : path.join(process.cwd(), 'rabbit.js');

        const output = execSync(`node "${rabbitPath}" --embed-url="${embedUrl}" --referrer="${referrer}"`, {
            encoding: 'utf8',
            timeout: 30000 // 30 second timeout
        });

        return JSON.parse(output.trim());
    } catch (error) {
        console.error('Error in handleEmbed:', error);
        return new EmbedSources();
    }
};

module.exports = {
    EmbedSources,
    Source,
    Track,
    handleEmbed
};
