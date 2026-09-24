/**
 * @name DisableMatchFoundSound
 * @author menfie
 * @description Disables sounds "sfx-readycheck-ringmagic-accepted-loop" and "sfx-readycheck-sr-portal"
 * @version 0.0.7.1
 * @link https://github.com/personinblack/Pengu-Disable-Match-Found-Loop-Sound
 */

export async function load() {
    const audioPlugin = await rcp.whenReady("rcp-fe-audio");

    const blockedUrls = [
        "sfx-readycheck-ringmagic-accepted-loop", 
        "sfx-readycheck-sr-portal"
    ];

    const dummySound = {
        play: () => Promise.resolve(null),
        stop: () => Promise.resolve(null),
        pause: () => Promise.resolve(null),
        dispose: () => Promise.resolve(null),
        setVolume: () => {},
        getVolume: () => 0,
        isPlaying: () => false,
        on: () => {},
        off: () => {},
        trigger: () => {}
    };

    const channelNames = Object.values(audioPlugin.getChannelsNames());

    channelNames.forEach(channelName => {
        const channel = audioPlugin.getChannel(channelName);
        if (channel && channel.createSound) {
            const originalCreateSound = channel.createSound.bind(channel);
            
            channel.createSound = function(url, options) {
                if (url && blockedUrls.some(blocked => url.includes(blocked))) {
                    console.log("BLOCKED AUDIO: ", url);
                    return dummySound;
                }
                
                return originalCreateSound(url, options);
            };
        }
    });
}
