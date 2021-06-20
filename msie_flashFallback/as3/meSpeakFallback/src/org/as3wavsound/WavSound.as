	/* 
	 * --------------------------------------
	 * Benny Bottema -- WavSound Sound adaption
	 * http://blog.projectnibble.org/
	 * --------------------------------------
	 * sazameki -- audio manipulating library
	 * http://sazameki.org/
	 * --------------------------------------
	 * 
	 * - developed by:
	 * 						Benny Bottema
	 * 						blog.projectnibble.org
	 *   hosted by: 
	 *  					Google Code (code.google.com)
	 * 						code.google.com/p/as3wavsound/
	 * 
	 * - audio library in its original state developed by:
	 * 						Takaaki Yamazaki
	 * 						www.zkdesign.jp
	 *   hosted by: 
	 *  					Spark project (www.libspark.org)
	 * 						www.libspark.org/svn/as3/sazameki/branches/fp10/
	 */
	
	/*
	 * Licensed under the MIT License
	 * 
	 * Copyright (c) 2008 Takaaki Yamazaki
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
package org.as3wavsound {
	import flash.media.SoundTransform;
	import flash.utils.ByteArray;
	import org.as3wavsound.sazameki.core.AudioSamples;
	import org.as3wavsound.sazameki.core.AudioSetting;
	import org.as3wavsound.sazameki.format.wav.Wav;
	
	/**
	 * Sound extension that directly plays WAVE data. Also backwards compatible with 
	 * MP3's played through the load() function. This class acts as facade to loading, 
	 * extracting, decoding and playing wav sound data and represents a single sound.
	 * 	  
	 * This class is analog to Adobe's Sound class and is designed to function the same 
	 * way.
	 * 
	 * Usage:	 
	 * Simply embed .wav files as you would mp3's and play with this Sound class.
	 * Make sure you provide mimetype 'application/octet-stream' when embedding to 
	 * ensure Flash embeds the data as ByteArray.
	 * 
	 * Example:
	 * [Embed(source = "drumloop.wav", mimeType = "application/octet-stream")]
	 * public const DrumLoop:Class;
	 * public const rain:WavSound = new WavSound(new DrumLoop() as ByteArray);
	 * 
	 * 
	 * @author Benny Bottema
	 */
	public class WavSound {
		
		// the master Sound player, which mixes all playing WavSound samples on any given moment
		private static const player:WavSoundPlayer = new WavSoundPlayer();
		
		// length of the original encoded wav data
		private var _bytesTotal:Number;
		// extracted sound data for mixing
		private var _samples:AudioSamples;
		// each sound can be configured to be played mono/stereo using AudioSetting
		private var _playbackSettings:AudioSetting;
		// calculated length of the entire sound in milliseconds, made global to avoid recalculating all the time
		private var _length:Number;
		
		/**
		 * Constructor: loads wavdata using load().
		 * 
		 * loads WAVE data and decodes it into playable samples. Finally calculates 
		 * the length of the sound in milliseconds.
		 * 
		 * @param	wavData A ByteArray containing uncmopressed wav data.
		 * @param	audioSettings An optional playback configuration (mono/stereo, 
		 * 			sample rate and bit rate).
		 */
		public function WavSound(wavData:ByteArray, audioSettings:AudioSetting = null) {
			load(wavData, audioSettings);
		}

		/**
		 * Key function: loads WAVE data and decodes it into playable samples. 
		 * Finally calculates the length of the sound in milliseconds.
		 * 
		 * @param	wavData The byte array that is the embedded .was file (octet-stream).
		 * @param	audioSettings Optional settings for playback (samplerate will enforced 
		 * 							if it differs from the .wav header data or header is missing).
		 * @see Wav#decode(ByteArray)
		 */
		internal function load(wavData:ByteArray, audioSettings:AudioSetting = null): void {
			this._bytesTotal = wavData.length;
			this._samples = new Wav().decode(wavData, audioSettings);
			this._playbackSettings = (audioSettings != null) ? audioSettings : new AudioSetting();
			this._length = samples.length / samples.setting.sampleRate * 1000;
		}

		/**
		 * See Adobe's Sound.play(): http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/media/Sound.html#play().
		 *		 		
		 * Playback function that performs the following tasks:
		 * 
		 * - calculates the startingPhase, bases on startTime in ms.
		 * - initializes loopsLeft variable
		 * - adds the playing channel in combination with its originating WavSound to the playingWavSounds
		 * 
		 * @param	startTime The starting time in milliseconds, applies to each loop (as with regular MP3 Sounds).
		 * @param	loops The number of loops to take in *addition* to the default playback (loops == 2 means 3 playthroughs).
		 * @param	sndTransform An optional soundtransform to apply for playback that controls volume and panning.
		 * @return The SoundChannel used for playing back the sound (and stopping the sound).
		 */
		public function play(startTime:Number = 0, loops:int = 0, sndTransform:SoundTransform = null): WavSoundChannel {
			return player.play(this, startTime, loops, sndTransform);
		}
		
		/**
		 * No idea if this works. Alpha state. Read up on Sound.extract():
		 * http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/media/Sound.html#extract()
		 * 
		 * Apparently, some people have used this succesfully, see comment 1 on Issue 11: 
		 * http://code.google.com/p/as3wavsound/issues/detail?id=11#c1		 		 
		 */
		public function extract(target:ByteArray, length:Number, startPosition:Number = -1): Number {
			var start:Number = Math.max(startPosition, 0);
			var end:Number = Math.min(length, samples.length);
			
			for (var i:Number = start; i < end; i++) {
				target.writeFloat(samples.left[i]);
				if (samples.setting.channels == 2) {
					target.writeFloat(samples.right[i]);
				} else {
					target.writeFloat(samples.left[i]);
				}
			}
			
			return samples.length;
		}
		
		/**
		 * Returns the total bytes of the wavData a WavSound was created with.
		 * 
		 * Note: 
		 *	This function is probably legacy, since we're not extending Adobe's 
		 *	Sound anymore (backwards compatibility was dropped in v0.7.
		 */
		public function get bytesLoaded () : uint {
			return _bytesTotal;
		}

		/**
		 * Returns the total bytes of the wavData a WavSound was created with.
		 * 
		 * Note: 
		 *	This function is probably legacy, since we're not extending Adobe's 
		 *	Sound anymore (backwards compatibility was dropped in v0.7.
		 */
		public function get bytesTotal () : int {
			return _bytesTotal;
		}

		/**
		 * Returns the total length of the sound in milliseconds.
		 */
		public function get length() : Number {
			return _length;
		}
		
		internal function get samples():AudioSamples {
			return _samples;
		}
		
		/**
		 * _playbackSettings is set when the load() function is called.
		 */
		internal function get playbackSettings():AudioSetting {
			return _playbackSettings;
		}
	}
}