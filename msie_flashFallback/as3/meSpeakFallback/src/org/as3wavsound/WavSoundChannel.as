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
	import flash.events.EventDispatcher;
	import flash.media.SoundChannel;
	import flash.events.Event;
	import flash.media.SoundTransform;
	import org.as3wavsound.sazameki.core.AudioSamples;
	import org.as3wavsound.WavSound;

	/**
	 * Used to keep track of open channels during playback. Each channel represents
	 * an 'instance' of a sound and so each channel is responsible for its own mixing.
	 * 
	 * The WavSound class uses the WavSoundPlayer to play instances of itself and 
	 * returns the WavSoundChannel returned by the player.
	 * 
	 * Also, the WavSoundPlayer uses the buffer() function to make the playing WavSoundChannel 
	 * mix its own samples into the master buffer.
	 * 
	 * Dispatches the Event.SOUND_COMPLETE event when the last sample has been mixed 
	 * into the master buffer.
	 *	 	 
	 * Also see buffer().
	 * 
	 * @author Benny Bottema
	 */
	public class WavSoundChannel extends EventDispatcher {
		
		/*
		 * creation-time information 
		 */
		
		// The player to delegate play() stop() requests to.
		private var player:WavSoundPlayer;
		
		// a WavSound currently playing back on this channel instance 
		// (there can be mutliple instances with the same WavSound).
		private var _wavSound:WavSound;
		
		// works the same as Adobe's SoundChannel.soundTransform
		private var _soundTransform:SoundTransform = new SoundTransform();
		
		/*
		 * play-time information *per WavSound instance*
		 */
		
		// starting phase if not at the beginning, made global to avoid recalculating all the time
		private var startPhase:Number; 
		// current phase of the sound, basically matches a single current sample frame for each WavSound
		private var phase:Number = 0;
		// the current avarage volume of samples buffered to the left audiochannel
		private var _leftPeak:Number = 0;
		// the current avarage volume of samples buffered to the right audiochannel
		private var _rightPeak:Number = 0;
		// how many loops we need to buffer
		private var loopsLeft:Number;
		// indicates if the phase has reached total sample count and no loops are left
		private var finished:Boolean;
		
		/**
		 * Constructor: pre-calculates starting phase (and performs some validation for this), see init().
		 */
		public function WavSoundChannel(player:WavSoundPlayer, wavSound:WavSound, startTime:Number, loops:int, soundTransform:SoundTransform) {
			this.player = player;
			this._wavSound = wavSound;
			if (soundTransform != null) {
				this._soundTransform = soundTransform;
			}
			init(startTime, loops);
		}
		
		/**
		 * Calculates and validates the starting time. Starting time in milliseconds is converted into 
		 * sample position and then marked as starting phase.
		 * 
		 * Also resets finished state and sets 'loopsLeft' equal to the given 'loops' value.
		 */
		internal function init(startTime:Number, loops:int):void {
			var startPositionInMillis:Number = Math.floor(startTime);
			var maxPositionInMillis:Number = Math.floor(_wavSound.length);
			if (startPositionInMillis > maxPositionInMillis) {
				throw new Error("startTime greater than sound's length, max startTime is " + maxPositionInMillis);
			}
			phase = startPhase = Math.floor(startPositionInMillis * _wavSound.samples.length / _wavSound.length);
			finished = false;
			loopsLeft = loops;
		}
		
		/**
		 * Tells the WavsoundPlayer to stop this specific SoundWavChannel instance.
		 */		
		public function stop():void {
			player.stop(this);
		}
		
		/**
		 * Called from WavSoundPlayer when the player is ready to mix new samples into the master 
		 * sample buffer.
		 * 		 		
		 * Fills a target samplebuffer with (optionally transformed) samples from the current
		 * WavSoundChannel instance.
		 * 
		 * Keeps filling the buffer until the last samples are buffered or until the buffersize is 
		 * reached. When the buffer is full, phase and loopsLeft keep track of how which samples 
		 * still need to be buffered in the next buffering cycle (when this method is called again).
		 * 
		 * @param	sampleBuffer The target buffer to mix in the current (transformed) samples.
		 * @param	soundTransform The soundtransform that belongs to a single channel being played 
		 * 			(containing volume, panning etc.).
		 */	
		internal function buffer(sampleBuffer:AudioSamples):void {
			// calculate volume and panning
			var volume: Number = (_soundTransform.volume / 1);
			var volumeLeft: Number = volume * (1 - _soundTransform.pan) / 2;
			var volumeRight: Number = volume * (1 + _soundTransform.pan) / 2;
			// channel settings
			var needRightChannel:Boolean = _wavSound.playbackSettings.channels == 2;
			var hasRightChannel:Boolean = _wavSound.samples.setting.channels == 2;
			
			// extra references to avoid excessive getter calls in the following 
			// for-loop (it appeares CPU is being hogged otherwise)
			var samplesLength:Number = _wavSound.samples.length;
			var samplesLeft:Vector.<Number> = _wavSound.samples.left;
			var samplesRight:Vector.<Number> = _wavSound.samples.right;
			var sampleBufferLength:Number = sampleBuffer.length;
			var sampleBufferLeft:Vector.<Number> = sampleBuffer.left;
			var sampleBufferRight:Vector.<Number> = sampleBuffer.right;
			
			var leftPeakRecord:Number = 0;
			var rightPeakRecord:Number = 0;
			
			// finally, mix the samples in the master sample buffer
			if (!finished) {
				for (var i:int = 0; i < sampleBufferLength; i++) {
					if (!finished) {					
						// write (transformed) samples to buffer
						var sampleLeft:Number = samplesLeft[phase] * volumeLeft;
						sampleBufferLeft[i] += sampleLeft;
						leftPeakRecord += sampleLeft;
						var channelValue:Number = ((needRightChannel && hasRightChannel) ? samplesRight[phase] : samplesLeft[phase]);
						var sampleRight:Number = channelValue * volumeRight;
						sampleBufferRight[i] += sampleRight;
						rightPeakRecord += sampleRight;
						
						// check playing and looping state
						if (++phase >= samplesLength) {
							phase = startPhase;
							finished = loopsLeft-- == 0;
						}
					}
				}
			
				if (finished) {
					dispatchEvent(new Event(Event.SOUND_COMPLETE));
				}
			}
			
			_leftPeak = leftPeakRecord / sampleBufferLength;
			_rightPeak = rightPeakRecord / sampleBufferLength
		}
		
		public function get leftPeak(): Number {
			return _leftPeak;
		}
		
 	 	public function get rightPeak(): Number {
			return _rightPeak;
		}
		
		/**
		 * Returns the current position in milliseconds: 
		 * 
		 * phase * wavSound.length / wavSound.samples.length
		 */		 		
 	 	public function get position(): Number {
			return phase * _wavSound.length / _wavSound.samples.length;
		}
		
		public function get soundTransform():SoundTransform {
			return _soundTransform;
		}
	}
}